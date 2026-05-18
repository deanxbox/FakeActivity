/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { Activity } from "@vencord/discord-types";
import { ActivityFlags, ActivityType } from "@vencord/discord-types/enums";
import { Button, FluxDispatcher, Menu } from "@webpack/common";

import { openFakeActivityModal } from "./FakeActivityModal";

export const defaultSettings = {
    isActive: false,
    appId: "356875570916753438",
    appName: "Minecraft",
    appIcon: "",
    details: "",
    state: "",
    elapsedSeconds: 0
};

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
}>();

export function ensureDefaultSettings() {
    if (settings.store.elapsedSeconds == null && typeof settings.store.elapsedMinutes === "number")
        settings.store.elapsedSeconds = settings.store.elapsedMinutes * 60;

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings.store[key] == null)
            settings.store[key] = value;
    }
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

export function buildGameActivity(): Activity {
    ensureDefaultSettings();

    const { appId, appName, appIcon, details, state, elapsedSeconds } = settings.store;
    const activity: Activity = {
        application_id: appId || "0",
        name: appName || "Unknown Game",
        type: ActivityType.PLAYING,
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
            ? { start: Date.now() - elapsedSeconds * 1000 }
            : undefined
    };

    return removeEmptyFields(activity);
}

export function buildFakeActivity() {
    ensureDefaultSettings();

    return buildGameActivity();
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

    try {
        FluxDispatcher.dispatch({
            type: "LOCAL_ACTIVITY_UPDATE",
            activity,
            socketId: "FakeActivity",
        });
    } catch (error) {
        console.error("[FakeActivity] Failed to dispatch activity update:", error);
    }
}

const FakeActivityPlugin = definePlugin({
    name: "FakeActivity",
    description: "Fake a game or Spotify listening activity with custom timestamps",
    tags: ["Activity", "Media"],
    authors: [{ name: "Dean", id: 285021062578700289n }],
    settings,

    start() {
        ensureDefaultSettings();
        if (settings.store.isActive) setFakeActivity(true);
    },

    stop() {
        setFakeActivity();
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
                        setFakeActivity(nowActive);
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
