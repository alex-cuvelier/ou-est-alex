/**
 * Player progress saved in localStorage, kept between visits:
 *
 *   {
 *     found:    { [questId]: { bestTime } },  // seconds, best time per found photo
 *     playTime: 11520,                         // seconds, all quests together
 *     last:     { level: 1, index: 2 },        // where to resume
 *   }
 *
 * Every access is wrapped: localStorage can throw in private browsing.
 */
const STORAGE_KEY = 'oea-progress';

function defaultStorage() {
    try {
        return typeof localStorage === 'undefined' ? undefined : localStorage;
    } catch {
        return undefined;
    }
}

export function emptyProgress() {
    return { found: {}, playTime: 0, last: null };
}

export function loadProgress(storage = defaultStorage()) {
    try {
        const raw = storage?.getItem(STORAGE_KEY);
        if (!raw) {
            return emptyProgress();
        }
        const data = JSON.parse(raw);
        return {
            ...emptyProgress(),
            ...data,
            found: { ...(data?.found ?? {}) },
        };
    } catch {
        return emptyProgress();
    }
}

export function saveProgress(progress, storage = defaultStorage()) {
    try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        // Private browsing or full storage: progress stays in memory for this session
    }
}
