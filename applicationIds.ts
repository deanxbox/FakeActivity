/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Activity } from "@vencord/discord-types";
import { ActivityType } from "@vencord/discord-types/enums";
import { filters, find } from "@webpack";
import { PresenceStore } from "@webpack/common";

export interface KnownApp {
    name: string;
    id: string;
    icon?: string | null;
}

export const KNOWN_APPS: KnownApp[] = [
    { name: "3D Aim Trainer", id: "1124351824611258510" },
    { name: "60 Seconds! Reatomized", id: "1124351892546404432" },
    { name: "Age of Empires III: Definitive Edition", id: "1124351777471484065" },
    { name: "Among Us", id: "748204194711298078" },
    { name: "Animaze", id: "1124351794659741846" },
    { name: "Apex Legends", id: "432980957394370602" },
    { name: "Asphalt Legends Unite", id: "1124351901702570034" },
    { name: "Assetto Corsa Competizione", id: "1124351838666375228" },
    { name: "Banana Shooter", id: "1124351732240101469" },
    { name: "Barotrauma", id: "1124351709225955388" },
    { name: "Battlefield 2042", id: "766708786567225365" },
    { name: "Battlefield V", id: "471853849428598794" },
    { name: "BIGFOOT", id: "1124351826486116372" },
    { name: "Blade & Sorcery", id: "1124351753249378304" },
    { name: "Blasphemous", id: "1124351877941841950" },
    { name: "Bloons TD Battles 2", id: "1124349981453721711" },
    { name: "BONEWORKS", id: "1124351856689303703" },
    { name: "Borderlands GOTY Enhanced", id: "1124351771133886615" },
    { name: "Bro Falls: Ultimate Showdown", id: "1124349958166941716" },
    { name: "Brotato", id: "1124351818437242910" },
    { name: "Call of Duty: Warzone", id: "855914576761831425" },
    { name: "Cell to Singularity - Evolution Never Ends", id: "1124351814926614659" },
    { name: "Chill Corner", id: "1124351765337354280" },
    { name: "Chivalry 2", id: "1124351943247155330" },
    { name: "City Car Driving", id: "1124351899806740570" },
    { name: "Combat Master", id: "1124351807645302905" },
    { name: "Cookie Clicker", id: "1124351789895004280" },
    { name: "Cooking Simulator", id: "1124351866415894691" },
    { name: "Core Keeper", id: "1124351749550002268" },
    { name: "Counter-Strike 2", id: "1069647130261528636" },
    { name: "Counter-Strike: GO", id: "356876590342340608" },
    { name: "Crab Champions", id: "1095820752877535262" },
    { name: "Crab Game", id: "1124108180125921400" },
    { name: "Crusader Kings III", id: "1124351691123343500" },
    { name: "Cult of the Lamb", id: "1124351730323308675" },
    { name: "Cyberpunk 2077", id: "799175736960024586" },
    { name: "Dark and Darker", id: "1124351715618074634" },
    { name: "Dark Deception", id: "1124351728049991680" },
    { name: "Days Gone", id: "1124351840608333845" },
    { name: "Dead by Daylight", id: "356876176465059840" },
    { name: "Deadside", id: "1124351862552932444" },
    { name: "Deepest Sword", id: "1124351883151167498" },
    { name: "Destiny 2", id: "356879795738992641" },
    { name: "Detroit: Become Human", id: "1124351832454615120" },
    { name: "Devil May Cry 5", id: "1124351724228988948" },
    { name: "DEVOUR", id: "1124349973711036548" },
    { name: "Diablo IV", id: "1106024216496848906" },
    { name: "DiRT Rally 2.0", id: "1124351828541329408" },
    { name: "Dorfromantik", id: "1124351958250176592" },
    { name: "Dota 2", id: "356869127241072640" },
    { name: "Drawful 2", id: "1124351742679728150" },
    { name: "Driver Booster for Steam", id: "1124351886846349312" },
    { name: "Drunken Wrestlers 2", id: "1124351686253756468" },
    { name: "Dying Light 2", id: "1124351684131442728" },
    { name: "Elden Ring", id: "910451784187277352" },
    { name: "Escape from Tarkov", id: "503557215897501706" },
    { name: "Escape Memoirs: Mini Stories", id: "1124351903636140054" },
    { name: "F1 2021", id: "1124351868458512546" },
    { name: "Five Nights at Freddy's: Security Breach", id: "1124351836544053340" },
    { name: "Football Manager 2020", id: "1124351787739136050" },
    { name: "Football Manager 2021", id: "1124351885151842345" },
    { name: "Football Manager 2022", id: "1124351933566697613" },
    { name: "Fortnite", id: "432980957394370572" },
    { name: "FPS Chess", id: "1124349963086856273" },
    { name: "Genshin Impact", id: "755794134782673931" },
    { name: "God of War", id: "1124351711486689290" },
    { name: "Goose Goose Duck", id: "1067554911358832721" },
    { name: "Gorilla Tag", id: "1124351721745956864" },
    { name: "Grand Theft Auto V", id: "356877880938070016" },
    { name: "Green Hell", id: "1124351667882688662" },
    { name: "GRIS", id: "1124351954831818833" },
    { name: "GUNDAM EVOLUTION", id: "1124351894521917458" },
    { name: "Half-Life: Alyx", id: "1124351756931977307" },
    { name: "Halo Infinite", id: "765100977867751424" },
    { name: "Hand Simulator: Survival", id: "1124351763433144330" },
    { name: "Helltaker", id: "1124349975359410317" },
    { name: "Hired Ops", id: "1124351935185694872" },
    { name: "Hogwarts Legacy", id: "1080277149623271444" },
    { name: "Hollow Knight", id: "356877336343511040" },
    { name: "Honkai: Star Rail", id: "1099849079691403264" },
    { name: "HonkaiImpact 3rd", id: "1124351937098301590" },
    { name: "Horizon Zero Dawn", id: "1124351698740195439" },
    { name: "In Silence", id: "1124351773067456552" },
    { name: "Inscryption", id: "1124351726158352456" },
    { name: "Inside the Backrooms", id: "1124351718134661200" },
    { name: "Katana ZERO", id: "1124351888737972295" },
    { name: "King of Crabs", id: "1124351775072338060" },
    { name: "Krunker", id: "1124349948201279568" },
    { name: "KurtzPel", id: "1124351693220491355" },
    { name: "Labyrinthine", id: "1124351928009244742" },
    { name: "Leaf Blower Revolution - Idle Game", id: "1124351767291904040" },
    { name: "League of Legends", id: "401518684763586560" },
    { name: "Loop Hero", id: "1124351844743917688" },
    { name: "Lost Ark", id: "907413688356806656" },
    { name: "Lost Light", id: "1124351842554495058" },
    { name: "Lunch Lady", id: "1124351809906036817" },
    { name: "Marbles on Stream", id: "1124351830244212767" },
    { name: "MARVEL SNAP", id: "1067552066454695965" },
    { name: "Marvel’s Spider-Man Remastered", id: "1124351769175150702" },
    { name: "Metin2", id: "1124351939249975327" },
    { name: "Minecraft", id: "356875570916753438" },
    { name: "Minecraft: Bedrock Edition", id: "1109775321170546738" },
    { name: "Mini Motorways", id: "1124351951153410148" },
    { name: "MONOPOLY Poker", id: "1124351858425741404" },
    { name: "MONSTER HUNTER RISE", id: "1022248949865791588" },
    { name: "Monster Hunter: World", id: "363417389558833152" },
    { name: "My Singing Monsters", id: "1124351688577396768" },
    { name: "NBA 2K20", id: "1124351949253394593" },
    { name: "NBA 2K23", id: "1124351874095661256" },
    { name: "Ninja Kiwi Archive", id: "1124351834283327559" },
    { name: "Noita", id: "1124351719950798848" },
    { name: "OMORI", id: "1124351759591161996" },
    { name: "OpenTTD", id: "1124351929712136192" },
    { name: "Ori and the Will of the Wisps", id: "673176567690387468" },
    { name: "Outer Wilds", id: "1124351860376096858" },
    { name: "Overwatch 2", id: "356875591190536193" },
    { name: "Pacify", id: "1124349960545128580" },
    { name: "Path of Exile", id: "356875988657553419" },
    { name: "Paunch", id: "1124351740335108166" },
    { name: "People Playground", id: "1124349965263720458" },
    { name: "PICO PARK", id: "1124349979658571847" },
    { name: "PICO PARK:Classic Edition", id: "1124351697007951964" },
    { name: "Pixel Strike 3D", id: "1124351707359498373" },
    { name: "PlateUp!", id: "1124351820576342026" },
    { name: "Pokémon GO", id: "423541415167279104" },
    { name: "PowerWash Simulator", id: "1124351751164801115" },
    { name: "Prison Life", id: "1124351846681694238" },
    { name: "Project Playtime", id: "1124349983408279623" },
    { name: "Project Winter", id: "1124351747574476942" },
    { name: "PUBG: BATTLEGROUNDS", id: "356877880938070031" },
    { name: "Puzzle Together", id: "1124351881553133628" },
    { name: "Quaver", id: "1124351864494899300" },
    { name: "Redmatch 2", id: "1124351745594773605" },
    { name: "Remnant: From the Ashes", id: "1124351734219817081" },
    { name: "Roblox", id: "363445589247131668" },
    { name: "Rocket League", id: "356877880938070028" },
    { name: "ROUNDS", id: "1124351761512157184" },
    { name: "Rust", id: "356877880938070022" },
    { name: "SCP: Escape Together", id: "1124351925316497438" },
    { name: "Sea of Thieves", id: "390510057336831995" },
    { name: "Secret Neighbor", id: "1124351870685696050" },
    { name: "Sekiro: Shadows Die Twice", id: "563455123988668438" },
    { name: "Skul: The Hero Slayer", id: "1124351848464269412" },
    { name: "Slapshot: Rebound", id: "1124351736275021855" },
    { name: "Slime Rancher 2", id: "1124351953024077845" },
    { name: "Sons Of The Forest", id: "1080279445153263686" },
    { name: "STALCRAFT", id: "1124351909235539978" },
    { name: "Stardew Valley", id: "356877880938070029" },
    { name: "Steam", id: "356875570916753440" },
    { name: "Stray", id: "1124351702972256328" },
    { name: "Stumble Guys", id: "1124351876033425529" },
    { name: "Super Animal Royale", id: "1124349971735511050" },
    { name: "Super Auto Pets", id: "1124351681929429032" },
    { name: "Super Bomberman R Online", id: "1124351890726080552" },
    { name: "Teardown", id: "1124351704880660691" },
    { name: "Terraria", id: "356878941687685120" },
    { name: "The Backrooms Game FREE Edition", id: "1124351852331413574" },
    { name: "The Henry Stickmin Collection", id: "1124351804977721455" },
    { name: "The Jackbox Party Pack 5", id: "1124351813395697705" },
    { name: "The Jackbox Party Pack 6", id: "1124351785851703336" },
    { name: "The Jackbox Party Pack 7", id: "1124351811659247626" },
    { name: "The Long Drive", id: "1124351947005243402" },
    { name: "The Two of Us", id: "1124351941263245342" },
    { name: "Thief Simulator", id: "1124351781753868369" },
    { name: "tModLoader", id: "1124349969906815007" },
    { name: "Tom Clancy's Rainbow Six Siege", id: "356876570163380224" },
    { name: "Totally Accurate Battle Simulator", id: "1124349977460744242" },
    { name: "Townscaper", id: "1124351956475981905" },
    { name: "ULTRAKILL", id: "1124351854831222945" },
    { name: "UNDEFEATED", id: "1124351850586591252" },
    { name: "Unfortunate Spacemen", id: "1124351779665100830" },
    { name: "Unrailed!", id: "1124351738053394472" },
    { name: "Unsolved Case", id: "1124351897915117610" },
    { name: "Valheim", id: "829830018819883059" },
    { name: "Valorant", id: "700136079562375258" },
    { name: "War Selection", id: "1124351803027378197" },
    { name: "We Were Here Together", id: "1124351920174284800" },
    { name: "World of Warcraft", id: "356879204620238849" },
    { name: "WorldBox - God Simulator", id: "1124351822530891956" },
    { name: "Zero Hour", id: "1124351783884570724" }
];

function isKnownApp(app: unknown): app is KnownApp {
    return typeof app === "object"
        && app !== null
        && typeof (app as KnownApp).name === "string"
        && typeof (app as KnownApp).id === "string";
}

function normalizeApp(app: any): KnownApp | null {
    const id = app?.id ?? app?.application_id ?? app?.applicationId;
    const name = app?.name ?? app?.application_name ?? app?.applicationName;
    const icon = app?.icon ?? app?.icon_hash ?? app?.iconHash ?? null;

    if (id == null || typeof name !== "string") return null;

    return {
        id: String(id),
        name,
        icon: typeof icon === "string" ? icon : null
    };
}

function collectApps(value: unknown, depth = 0): KnownApp[] {
    if (!value || depth > 3) return [];

    const app = normalizeApp(value);
    if (app) return [app];

    const rawApps = value instanceof Map
        ? Array.from(value.values())
        : Array.isArray(value)
            ? value
            : typeof value === "object"
                ? Object.values(value)
                : [];

    return rawApps.flatMap(rawApp => collectApps(rawApp, depth + 1));
}

function dedupeApps(apps: KnownApp[]) {
    const seen = new Set<string>();
    const deduped: KnownApp[] = [];

    for (const app of apps) {
        const existing = deduped.find(existingApp => existingApp.id === app.id);
        if (existing) {
            if (!existing.icon && app.icon)
                existing.icon = app.icon;

            continue;
        }

        if (seen.has(app.id)) continue;
        seen.add(app.id);
        deduped.push(app);
    }

    return deduped.sort((a, b) => a.name.localeCompare(b.name));
}

function findModuleByProps(...props: string[]) {
    try {
        return find(filters.byProps(...props), { isIndirect: true }) as any;
    } catch {
        return null;
    }
}

function findModuleByCode(...code: string[]) {
    try {
        return find(filters.byCode(...code), { isIndirect: true }) as any;
    } catch {
        return null;
    }
}

function getDiscordGames(): KnownApp[] {
    const probes: Array<() => unknown> = [
        () => findModuleByProps("getDetectableApplications")?.getDetectableApplications?.(),
        () => findModuleByProps("getApplications", "getApplication")?.getApplications?.(),
        () => findModuleByProps("DETECTABLE_APPLICATIONS")?.DETECTABLE_APPLICATIONS,
        () => findModuleByCode("\"detectable\"", "\"executables\""),
        () => findModuleByProps("getGame", "getGames")?.getGames?.()
    ];

    for (const probe of probes) {
        try {
            const apps = collectApps(probe());
            if (apps.length > 20) return apps;
        } catch { }
    }

    return [];
}

function getActivityAppIcon(activity: Activity) {
    const appId = activity.application_id;
    const largeImage = activity.assets?.large_image;

    if (!appId || typeof largeImage !== "string") return null;

    const appIconPrefix = `mp:app-icons/${appId}/`;
    if (!largeImage.startsWith(appIconPrefix)) return null;

    return largeImage
        .slice(appIconPrefix.length)
        .replace(/\.(?:png|jpe?g|webp|gif)$/i, "")
        .split("?")[0]
        || null;
}

function collectLoadedActivityApps(): KnownApp[] {
    const apps: KnownApp[] = [];
    const seenActivityKeys = new Set<string>();

    function collectActivity(activity: Activity) {
        if (
            activity.type !== ActivityType.PLAYING
            || !activity.application_id
            || !activity.name
            || activity.application_id === "spotify"
        ) return;

        const key = `${activity.application_id}:${activity.name}`;
        if (seenActivityKeys.has(key)) return;
        seenActivityKeys.add(key);

        apps.push({
            id: String(activity.application_id),
            name: String(activity.name),
            icon: getActivityAppIcon(activity)
        });
    }

    try {
        for (const userId of PresenceStore?.getUserIds?.() ?? []) {
            for (const activity of PresenceStore.getUnfilteredActivities?.(userId) ?? PresenceStore.getActivities?.(userId) ?? [])
                collectActivity(activity);
        }

        const state = PresenceStore?.getState?.();
        for (const activityGroups of [
            state?.activities,
            state?.filteredActivities,
            state?.hiddenActivities
        ]) {
            for (const activities of Object.values(activityGroups ?? {}))
                for (const activity of activities)
                    collectActivity(activity);
        }

        for (const guildPresences of Object.values(state?.presencesForGuilds ?? {}))
            for (const presence of Object.values(guildPresences))
                for (const activity of presence.activities ?? [])
                    collectActivity(activity);
    } catch { }

    return apps;
}

export async function discoverApplications(): Promise<KnownApp[]> {
    return dedupeApps([...collectLoadedActivityApps(), ...getDiscordGames(), ...KNOWN_APPS]);
}

export async function searchDiscordApplications(query: string): Promise<KnownApp[]> {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];

    try {
        const res = await fetch(`/api/v9/applications/public?query=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return [];

        const body = await res.json();
        return dedupeApps(collectApps(body)).slice(0, 25);
    } catch {
        return [];
    }
}
