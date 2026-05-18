/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { classNameFactory } from "@utils/css";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { React, Text, useEffect, useMemo, useState } from "@webpack/common";

import { defaultSettings, setFakeActivity, settings } from ".";
import { discoverApplications, KnownApp, searchDiscordApplications } from "./applicationIds";

const cl = classNameFactory("vc-fakeactivity-");

type DraftSettings = typeof defaultSettings;

function getDraftSettings(): DraftSettings {
    return {
        isActive: settings.store.isActive ?? defaultSettings.isActive,
        appId: settings.store.appId ?? defaultSettings.appId,
        appName: settings.store.appName ?? defaultSettings.appName,
        appIcon: settings.store.appIcon ?? defaultSettings.appIcon,
        details: settings.store.details ?? defaultSettings.details,
        state: settings.store.state ?? defaultSettings.state,
        elapsedSeconds: settings.store.elapsedSeconds
            ?? (typeof settings.store.elapsedMinutes === "number" ? settings.store.elapsedMinutes * 60 : defaultSettings.elapsedSeconds)
    };
}

function parseNumberInput(value: string, min: number, max: number) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return min;

    return Math.min(max, Math.max(min, parsed));
}

function TextSetting<T extends keyof DraftSettings>(props: {
    draft: DraftSettings;
    setDraft: React.Dispatch<React.SetStateAction<DraftSettings>>;
    settingsKey: T;
    label: string;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    validator?: (value: string) => string;
}) {
    const stringValue = String(props.draft[props.settingsKey] ?? "");
    const requiredError = props.required && !stringValue ? "This field is required." : "";
    const maxLengthError = props.maxLength && stringValue.length > props.maxLength ? `Must be ${props.maxLength} characters or fewer.` : "";
    const customError = props.validator?.(stringValue) ?? "";
    const error = requiredError || maxLengthError || customError;

    return (
        <label className={cl("single")}>
            <span className={cl("label")}>{props.label}</span>
            <input
                className={cl("input")}
                type="text"
                placeholder={props.placeholder ?? "Enter a value"}
                value={stringValue}
                onChange={event => {
                    const value = event.currentTarget.value as DraftSettings[T];

                    props.setDraft(draft => ({
                        ...draft,
                        [props.settingsKey]: value,
                        ...(props.settingsKey === "appId" ? { appIcon: "" } : {})
                    }));
                }}
            />
            <span className={cl("error")}>{error}</span>
        </label>
    );
}

function TimeSetting(props: {
    draft: DraftSettings;
    setDraft: React.Dispatch<React.SetStateAction<DraftSettings>>;
    label: string;
    suffix?: string;
}) {
    const totalSeconds = Math.max(0, Number(props.draft.elapsedSeconds) || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    function setTime(nextHours: number, nextMinutes: number, nextSeconds: number) {
        props.setDraft(draft => ({
            ...draft,
            elapsedSeconds: nextHours * 3600 + nextMinutes * 60 + nextSeconds
        }));
    }

    return (
        <div className={cl("single")}>
            <span className={cl("label")}>{props.label}</span>
            <div className={cl("time-grid")}>
                <label className={cl("time-field")}>
                    <span>Hours</span>
                    <input
                        className={cl("input")}
                        type="number"
                        min={0}
                        value={String(hours)}
                        onChange={event => setTime(parseNumberInput(event.currentTarget.value, 0, 999999), minutes, seconds)}
                    />
                </label>
                <label className={cl("time-field")}>
                    <span>Minutes</span>
                    <input
                        className={cl("input")}
                        type="number"
                        min={0}
                        max={59}
                        value={String(minutes)}
                        onChange={event => setTime(hours, parseNumberInput(event.currentTarget.value, 0, 59), seconds)}
                    />
                </label>
                <label className={cl("time-field")}>
                    <span>Seconds</span>
                    <input
                        className={cl("input")}
                        type="number"
                        min={0}
                        max={59}
                        value={String(seconds)}
                        onChange={event => setTime(hours, minutes, parseNumberInput(event.currentTarget.value, 0, 59))}
                    />
                </label>
            </div>
            {props.suffix && <span className={cl("hint")}>{props.suffix}</span>}
        </div>
    );
}

function mergeApps(...appGroups: KnownApp[][]) {
    const seen = new Set<string>();
    const merged: KnownApp[] = [];

    for (const rawApp of appGroups.flat()) {
        const app = {
            ...rawApp,
            id: String(rawApp.id ?? ""),
            name: String(rawApp.name ?? "")
        };

        if (!app.id || !app.name || seen.has(app.id)) continue;
        seen.add(app.id);
        merged.push(app);
    }

    return merged;
}

function GameApplicationPicker(props: {
    draft: DraftSettings;
    setDraft: React.Dispatch<React.SetStateAction<DraftSettings>>;
}) {
    const [apps, setApps] = useState<KnownApp[]>([]);
    const [remoteApps, setRemoteApps] = useState<KnownApp[]>([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let cancelled = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        function refreshApplications() {
            discoverApplications().then(discovered => {
                if (!cancelled) setApps(discovered);
            }).finally(() => {
                if (!cancelled)
                    timeout = setTimeout(refreshApplications, 5000);
            });
        }

        refreshApplications();

        return () => {
            cancelled = true;
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const timeout = setTimeout(() => {
            searchDiscordApplications(query).then(results => {
                if (!cancelled) setRemoteApps(results);
            });
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [query]);

    const options = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const merged = mergeApps(remoteApps, apps);

        if (!normalizedQuery) return merged.slice(0, 50);

        return merged
            .filter(app => app.name.toLowerCase().includes(normalizedQuery) || String(app.id).includes(normalizedQuery))
            .slice(0, 50);
    }, [apps, remoteApps, query]);

    function selectApp(app: KnownApp) {
        props.setDraft(draft => ({
            ...draft,
            appId: app.id,
            appName: app.name,
            appIcon: app.icon ?? ""
        }));

        if (app.icon) return;

        fetch(`/api/v9/applications/public/${encodeURIComponent(app.id)}`)
            .then(res => res.ok ? res.json() : null)
            .then(async data => {
                const icon = data?.icon
                    ?? (await searchDiscordApplications(app.name))
                        .find(result => result.id === app.id || result.name.toLowerCase() === app.name.toLowerCase())
                        ?.icon;

                if (!icon) return;

                props.setDraft(draft => draft.appId === app.id
                    ? { ...draft, appIcon: icon }
                    : draft);
            })
            .catch(() => { });
    }

    return (
        <div className={cl("single", "wide")}>
            <span className={cl("label")}>Application</span>
            <input
                className={cl("input")}
                type="text"
                value={query}
                placeholder="Search for an activity"
                onChange={event => setQuery(event.currentTarget.value)}
            />
            <div className={cl("app-list")}>
                {options.map(app => (
                    <button
                        key={app.id}
                        type="button"
                        className={`${cl("app-option")} ${app.id === props.draft.appId ? cl("app-option-selected") : ""}`}
                        onClick={() => selectApp(app)}
                    >
                        <span>{app.name}</span>
                        <span>{app.id}</span>
                    </button>
                ))}
            </div>
            <span className={cl("hint")}>Showing discovered and popular activities. Type to search all Discord-registered activities.</span>
        </div>
    );
}

function ActivitySettingsForm(props: {
    draft: DraftSettings;
    setDraft: React.Dispatch<React.SetStateAction<DraftSettings>>;
}) {
    return (
        <div className={cl("tab-content")}>
            <GameApplicationPicker {...props} />
            <div className={cl("pair")}>
                <TextSetting
                    {...props}
                    settingsKey="appName"
                    label="App Name"
                    required
                    maxLength={128}
                />
                <TextSetting
                    {...props}
                    settingsKey="appId"
                    label="App ID"
                    validator={value => value && !/^\d{16,21}$/.test(value) ? "Must be a valid Discord application ID." : ""}
                />
            </div>
            <div className={cl("pair")}>
                <TextSetting
                    {...props}
                    settingsKey="details"
                    label="Details (line 1)"
                    maxLength={128}
                />
                <TextSetting
                    {...props}
                    settingsKey="state"
                    label="State (line 2)"
                    maxLength={128}
                />
            </div>
            <TimeSetting
                {...props}
                label="Playing for"
                suffix="Set hours, minutes, and seconds to 0 to hide the elapsed timer."
            />
        </div>
    );
}

function getPreviewImageUrl(draft: DraftSettings) {
    return draft.appIcon && draft.appId
        ? `https://cdn.discordapp.com/app-icons/${draft.appId}/${draft.appIcon}.png?size=128`
        : "";
}

function formatDuration(totalSeconds: number) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    if (hours > 0)
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getPreviewTimeText(draft: DraftSettings) {
    if (draft.elapsedSeconds <= 0) return "No elapsed timer";

    return `${formatDuration(draft.elapsedSeconds)} elapsed`;
}

function ActivityPreview({ draft }: { draft: DraftSettings; }) {
    const imageUrl = getPreviewImageUrl(draft);

    return (
        <div className={cl("preview")}>
            <h4 className={cl("heading")}>Preview</h4>
            <div className={cl("preview-card")}>
                <div
                    className={cl("preview-image")}
                    style={{ backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined }}
                >
                    <span>{imageUrl ? "" : "No image"}</span>
                </div>
                <div className={cl("preview-body")}>
                    <strong>{`Playing ${draft.appName || defaultSettings.appName}`}</strong>
                    <span>{draft.details || "No details set"}</span>
                    <span>{draft.state || "No state set"}</span>
                    <span>{getPreviewTimeText(draft)}</span>
                </div>
            </div>
        </div>
    );
}

function FakeActivitySettingsInner({ onClose }: { onClose: () => void; }) {
    const [draft, setDraft] = useState(getDraftSettings);

    function commitDraft(isActive: boolean) {
        for (const [key, value] of Object.entries({ ...draft, isActive })) {
            if (settings.store[key] !== value)
                settings.store[key] = value;
        }

        setFakeActivity(isActive);
        onClose();
    }

    return (
        <div className={cl("modal-content")}>
            <ActivitySettingsForm draft={draft} setDraft={setDraft} />

            <ActivityPreview draft={draft} />

            <div className={cl("footer")}>
                <button
                    type="button"
                    className={cl("plain-button")}
                    onClick={() => commitDraft(false)}
                >
                    Disable
                </button>
                <button
                    type="button"
                    className={`${cl("plain-button")} ${cl("plain-button-active")}`}
                    onClick={() => commitDraft(true)}
                >
                    Apply & Enable
                </button>
            </div>
        </div>
    );
}

function FakeActivityModalWrapper({ rootProps }: { rootProps: ModalProps; }) {
    return (
        <ModalRoot {...rootProps} size={ModalSize.LARGE}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>
                    Fake Activity Settings
                </Text>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>

            <ModalContent>
                <FakeActivitySettingsInner onClose={rootProps.onClose} />
            </ModalContent>
        </ModalRoot>
    );
}

export function openFakeActivityModal() {
    openModal(props => <FakeActivityModalWrapper rootProps={props} />);
}
