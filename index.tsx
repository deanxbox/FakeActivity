/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import type { Activity, Channel, User } from "@vencord/discord-types";
import { ActivityFlags, ActivityType } from "@vencord/discord-types/enums";
import { Button, FluxDispatcher, Menu, PresenceStore, UserStore } from "@webpack/common";

import { openFakeActivityModal } from "./FakeActivityModal";

export const defaultSettings = {
    isActive: false,
    appId: "356875570916753438",
    appName: "Minecraft",
    appIcon: "",
    details: "",
    state: "",
    elapsedSeconds: 0,
    activityType: 0 as number, // ActivityType.PLAYING
    overrideCopiedValues: false
};

const FAKE_ACTIVITY_SOCKET_ID = "FakeActivity";
const LARP_LISTENING_SOCKET_ID = "FakeActivityListening";
const SPOTIFY_APPLICATION_ID = "321895300310712320";
const SPOTIFY_APPLICATION_IDS = new Set([SPOTIFY_APPLICATION_ID, "spotify"]);
const ALLOWED_ACTIVITY_TYPES: number[] = [ActivityType.PLAYING, ActivityType.LISTENING, ActivityType.WATCHING];

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user?: User;
}

// anchors the manual elapsed timer so Larp updates don't reset it
let manualStartedAt = Date.now();
let larpTargetUserId: string | null = null;
let larpTargetGuildId: string | undefined;
let larpPrimaryActivity: Activity | null = null;
let larpPrimaryActivityFingerprint = "";
let larpListeningActivity: Activity | null = null;
let larpListeningActivityFingerprint = "";

export const settings = definePluginSettings({
    config: {
        type: OptionType.COMPONENT,
        description: "Open the Fake Activity configuration window",
        component: () => (
            <Button onClick={openFakeActivityModal}>
                Open Fake Activity Settings
            </Button>
        )
    },
}).withPrivateSettings<{
    isActive: boolean;
    appId: string;
    appName: string;
    appIcon: string;
    details: string;
    state: string;
    elapsedSeconds: number;
    elapsedMinutes?: number;
    activityType: number;
    overrideCopiedValues: boolean;
}>();

export function ensureDefaultSettings() {
    if (settings.store.elapsedSeconds == null && typeof settings.store.elapsedMinutes === "number")
        settings.store.elapsedSeconds = settings.store.elapsedMinutes * 60;

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings.store[key] == null)
            settings.store[key] = value;
    }

    if (settings.store.appId === "0") settings.store.appId = defaultSettings.appId; // legacy Larp copy artefact

    if (!ALLOWED_ACTIVITY_TYPES.includes(settings.store.activityType))
        settings.store.activityType = ActivityType.PLAYING;
}

export function getSettingsError(s: typeof defaultSettings) {
    if (!s.appName?.trim()) return "App name is required.";
    if (s.appName.length > 128 || (s.details?.length ?? 0) > 128 || (s.state?.length ?? 0) > 128)
        return "Text fields must be 128 characters or fewer.";
    if (s.appId && !/^\d{16,21}$/.test(s.appId)) return "App ID must be a valid Discord application ID.";
    return "";
}

function removeEmptyFields<T extends Activity>(activity: T): T {
    for (const key of Object.keys(activity)) {
        if (key === "type" || key === "flags") continue;

        const value = activity[key];
        if (value == null || value === "" || (Array.isArray(value) && value.length === 0))
            delete activity[key];
    }

    return activity;
}

function cloneActivity(activity: Activity): Activity {
    // Whitelist: buttons, party, session ids etc. are not safe to replay locally.
    const { application_id, name, type, details, state, timestamps, assets } = activity;
    const clone = JSON.parse(JSON.stringify({
        application_id, name, type, details, state, timestamps, assets, flags: ActivityFlags.INSTANCE
    })) as Activity;

    return removeEmptyFields(clone);
}

function isListeningActivity(activity: Activity) {
    return activity.type === ActivityType.LISTENING;
}

function isSpotifyActivity(activity: Activity) {
    return activity.name?.toLowerCase() === "spotify"
        || activity.id?.startsWith("spotify:")
        || SPOTIFY_APPLICATION_IDS.has(activity.application_id ?? "");
}

export function isSpotifyConfig(appName: string, appId: string) {
    return (appName ?? "").trim().toLowerCase() === "spotify" || SPOTIFY_APPLICATION_IDS.has(appId);
}

function isSpotifyManualConfig() {
    return isSpotifyConfig(settings.store.appName, settings.store.appId);
}

function isOverrideActive() {
    return !!settings.store.overrideCopiedValues && !!settings.store.isActive;
}

function cloneListeningActivity(activity: Activity): Activity {
    const clone = cloneActivity(activity);

    clone.type = ActivityType.LISTENING;

    if (isSpotifyActivity(activity)) {
        clone.application_id = SPOTIFY_APPLICATION_ID;
        clone.name = activity.state || activity.details || activity.name || "Spotify";
    }

    return removeEmptyFields(clone);
}

function getLarpableActivities(userId: string, guildId?: string) {
    const activities = [
        ...(PresenceStore.getActivities(userId, guildId) ?? []),
        ...(PresenceStore.getUnfilteredActivities(userId, guildId) ?? [])
    ].filter((activity, index, allActivities) =>
        allActivities.findIndex(other =>
            other.type === activity.type
            && other.name === activity.name
            && other.application_id === activity.application_id
            && other.id === activity.id
            && other.sync_id === activity.sync_id
        ) === index
    );

    return {
        primary: activities.find(activity =>
            activity.type !== ActivityType.CUSTOM_STATUS
            && !isListeningActivity(activity)
        ) ?? null,
        listening: activities.find(isListeningActivity) ?? null
    };
}

// With Listening selected, overrides apply to the copied listening slot instead of the primary one.
function overridesListening() {
    return isOverrideActive() && settings.store.activityType === ActivityType.LISTENING && !!larpListeningActivity;
}

function mergeOverride(copied: Activity | null) {
    if (!copied) return copied;

    try {
        const manual = buildGameActivity();
        // copied asset keys belong to the copied application, so keep them only for the same app
        const sameApp = copied.application_id === manual.application_id;

        return removeEmptyFields({
            ...copied,
            ...manual,
            assets: manual.assets ?? (sameApp ? copied.assets : undefined)
        } as Activity);
    } catch (error) {
        console.error("[FakeActivity] Override invalid, using copied activity:", error);
        return copied;
    }
}

function updateLarpedActivity(force = false) {
    if (!larpTargetUserId) return;

    const { primary, listening } = getLarpableActivities(larpTargetUserId, larpTargetGuildId);
    const nextPrimaryActivity = primary ? cloneActivity(primary) : null;
    const nextListeningActivity = listening ? cloneListeningActivity(listening) : null;
    const nextPrimaryFingerprint = JSON.stringify(nextPrimaryActivity);
    const nextListeningFingerprint = JSON.stringify(nextListeningActivity);

    const primaryChanged = force || nextPrimaryFingerprint !== larpPrimaryActivityFingerprint;
    const listeningChanged = force || nextListeningFingerprint !== larpListeningActivityFingerprint;

    // assign both slots first: primary routing depends on whether a listening slot exists
    larpPrimaryActivity = nextPrimaryActivity;
    larpPrimaryActivityFingerprint = nextPrimaryFingerprint;
    larpListeningActivity = nextListeningActivity;
    larpListeningActivityFingerprint = nextListeningFingerprint;

    if (primaryChanged || listeningChanged)
        setFakeActivity(true);

    if (listeningChanged) {
        dispatchActivityUpdate(LARP_LISTENING_SOCKET_ID, overridesListening() ? mergeOverride(larpListeningActivity) : larpListeningActivity);
    }
}

function clearLarpingActivity() {
    larpTargetUserId = null;
    larpTargetGuildId = undefined;
    larpPrimaryActivity = null;
    larpPrimaryActivityFingerprint = "";
    larpListeningActivity = null;
    larpListeningActivityFingerprint = "";
}

function startLarpingActivity(userId: string, guildId?: string) {
    larpTargetUserId = userId;
    larpTargetGuildId = guildId;

    updateLarpedActivity(true);
}

function stopLarpingActivity() {
    clearLarpingActivity();
    dispatchActivityUpdate(LARP_LISTENING_SOCKET_ID, null);
    // fall back to the user's own manual activity if it is enabled
    setFakeActivity(!!settings.store.isActive);
}

function handlePresenceChange() {
    if (!larpTargetUserId) return;

    updateLarpedActivity();
}

export function buildGameActivity(): Activity {
    ensureDefaultSettings();

    const error = getSettingsError(settings.store);
    if (error) throw new Error(error);

    if (isSpotifyManualConfig())
        throw new Error("Spotify activities can only be cloned with Larp Activity.");

    const { appId, appName, appIcon, details, state, elapsedSeconds } = settings.store;
    const activity: Activity = {
        application_id: appId || "0",
        name: appName || "Unknown Game",
        type: settings.store.activityType as ActivityType,
        flags: ActivityFlags.INSTANCE,
        details: details || undefined,
        state: state || undefined,
        assets: appIcon && appId
            ? {
                large_image: `mp:app-icons/${appId}/${appIcon}`,
                large_text: appName || undefined
            }
            : undefined,
        timestamps: elapsedSeconds > 0
            ? { start: manualStartedAt - elapsedSeconds * 1000 }
            : undefined
    };

    return removeEmptyFields(activity);
}

export function buildFakeActivity() {
    ensureDefaultSettings();

    if (larpTargetUserId) {
        if (!isOverrideActive() || overridesListening()) return larpPrimaryActivity;

        // manual (non-empty) fields win over the copied ones
        return larpPrimaryActivity ? mergeOverride(larpPrimaryActivity) : (() => {
            try { return buildGameActivity(); } catch { return null; }
        })();
    }

    return buildGameActivity();
}

function dispatchActivityUpdate(socketId: string, activity: Activity | null) {
    try {
        FluxDispatcher.dispatch({
            type: "LOCAL_ACTIVITY_UPDATE",
            activity,
            socketId,
        });
    } catch (error) {
        console.error(`[FakeActivity] Failed to dispatch ${socketId} activity update:`, error);
    }
}

export function setFakeActivity(enable?: boolean) {
    ensureDefaultSettings();

    let activity: Activity | null = null;
    if (enable) {
        try {
            activity = buildFakeActivity();
        } catch (error) {
            console.error("[FakeActivity] Failed to build activity:", error);
        }
    }

    dispatchActivityUpdate(FAKE_ACTIVITY_SOCKET_ID, activity);
}

export function setManualFakeActivity(enable?: boolean) {
    manualStartedAt = Date.now();

    if (enable && larpTargetUserId && settings.store.overrideCopiedValues) {
        updateLarpedActivity(true);
        return;
    }

    clearLarpingActivity();

    dispatchActivityUpdate(LARP_LISTENING_SOCKET_ID, null);

    if (enable && isSpotifyManualConfig()) {
        settings.store.isActive = false;
        setFakeActivity(false);
        return;
    }

    setFakeActivity(enable);
}

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { guildId, user }: UserContextProps) => {
    if (!user || user.id === UserStore.getCurrentUser()?.id) return;

    const isCurrentLarpTarget = larpTargetUserId === user.id;

    children.push(
        <Menu.MenuItem
            id="vc-fakeactivity-larp"
            label={isCurrentLarpTarget ? "Stop Larping Activity" : "Larp Activity"}
            action={() => {
                if (isCurrentLarpTarget)
                    stopLarpingActivity();
                else
                    startLarpingActivity(user.id, guildId);
            }}
        />
    );
};

const FakeActivityPlugin = definePlugin({
    name: "FakeActivity",
    description: "Fake a game activity or copy another user's activity",
    tags: ["Activity", "Media"],
    authors: [{ name: "Dean", id: 285021062578700289n }],
    settings,

    start() {
        ensureDefaultSettings();
        PresenceStore.addChangeListener(handlePresenceChange);
        if (settings.store.isActive) setFakeActivity(true);
    },

    stop() {
        PresenceStore.removeChangeListener(handlePresenceChange);
        clearLarpingActivity();
        setFakeActivity();
        dispatchActivityUpdate(LARP_LISTENING_SOCKET_ID, null);
    },

    contextMenus: {
        "user-context": UserContextMenuPatch
    },

    toolboxActions() {
        return (
            <>
                <Menu.MenuCheckboxItem
                    id="fake-activity-toggle"
                    label="Fake Activity"
                    checked={settings.store.isActive ?? false}
                    action={() => {
                        ensureDefaultSettings();
                        const nowActive = !(settings.store.isActive ?? false);
                        settings.store.isActive = nowActive;
                        setManualFakeActivity(nowActive);
                    }}
                />
                <Menu.MenuItem
                    id="fake-activity-settings"
                    label="Configure Fake Activity"
                    action={openFakeActivityModal}
                />
            </>
        );
    }
});

export default FakeActivityPlugin;
