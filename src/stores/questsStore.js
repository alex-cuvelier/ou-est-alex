import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';
import { emptyProgress, loadProgress, saveProgress } from '@/utils/progress.js';

// Under this, a visit without any click or clue is a glance, not a search: the photo stays "to find"
export const SEARCH_THRESHOLD = 5; // seconds

const playableQuests = quests.filter((quest) => quest.type !== 'end');
const endQuest = { ...(quests.find((quest) => quest.type === 'end') ?? { type: 'end' }), id: 'end' };

function normalize(quest) {
    return { ...quest, type: 'quest', id: String(quest.id) };
}

/**
 * Quests list for a level: its photos (in quests.json order), then the end screen.
 * Level 'all' plays every photo.
 */
function questsForLevel(level) {
    const photos = level === 'all' ? playableQuests : playableQuests.filter((quest) => quest.difficultyLevel == level);
    return [...photos.map(normalize), endQuest];
}

function photosForLevel(level) {
    return questsForLevel(level).slice(0, -1);
}

// Times are kept to the tenth of a second (summing floats would drift otherwise)
function roundTime(seconds) {
    return Math.round(seconds * 10) / 10;
}

function emptyStat() {
    return { time: 0, clueCount: 0, noCount: 0, found: false };
}

/** 'found' | 'missed' (searched, not found) | 'todo' (not searched yet in this run) */
function statusOf(stat) {
    if (stat?.found) {
        return 'found';
    }
    if (stat && (stat.time >= SEARCH_THRESHOLD || stat.clueCount > 0 || stat.noCount > 0)) {
        return 'missed';
    }
    return 'todo';
}

/** First photo not found yet, from `from` onwards then back from the start; -1 when they are all found */
function findToSearch(photos, stats, from) {
    for (let step = 0; step < photos.length; step++) {
        const index = (from + step) % photos.length;
        if (!stats[photos[index].id]?.found) {
            return index;
        }
    }
    return -1;
}

export const useQuestsStore = defineStore('quests', () => {
    const difficultyLevels = computed(() =>
        Array.from(new Set(playableQuests.filter((quest) => quest.difficultyLevel != null).map((quest) => quest.difficultyLevel))).sort((a, b) => a - b),
    );

    const currentDifficultyLevel = ref(0);
    const currentQuestIndex = ref(0);

    const filteredQuests = computed(() => questsForLevel(currentDifficultyLevel.value));
    const currentQuest = computed(() => filteredQuests.value[currentQuestIndex.value]);

    // Including the end screen
    const questsCount = computed(() => filteredQuests.value.length);
    // Photos only
    const photoCount = computed(() => filteredQuests.value.length - 1);
    const levelPhotos = computed(() => filteredQuests.value.slice(0, -1));

    // --- Saved progress, kept between visits ---

    const progress = ref(loadProgress());

    function save() {
        saveProgress(progress.value);
    }

    // --- Runs: one per level, saved, kept until "Play again" ---

    /**
     * A level's run, or the one it starts with: a level never played starts with the photos
     * already found elsewhere (in another level, or before runs were saved).
     */
    function runFor(level) {
        const run = progress.value.runs[level];
        if (run) {
            return run;
        }

        const stats = {};
        for (const quest of photosForLevel(level)) {
            const best = progress.value.found[quest.id]?.bestTime;
            if (best != null) {
                stats[quest.id] = { ...emptyStat(), time: best, found: true };
            }
        }
        const last = progress.value.last;
        return { index: last && String(last.level) === String(level) ? last.index : 0, stats };
    }

    // The run is saved from the first visit or record in the level
    function ensureRun(level) {
        if (!progress.value.runs[level]) {
            progress.value.runs[level] = runFor(level);
        }
        return progress.value.runs[level];
    }

    const runStats = computed(() => runFor(currentDifficultyLevel.value).stats);

    /**
     * Adds a visit to a photo of the run: time and counters add up, a photo stays found once found.
     * The level is the one the visit was made in (the player may have switched since).
     */
    function recordAttempt(questId, { time = 0, clueCount = 0, noCount = 0, found = false }, level = currentDifficultyLevel.value) {
        if (!questId || questId === 'end') {
            return;
        }

        const run = ensureRun(level);
        const previous = run.stats[questId] ?? emptyStat();
        const attempt = {
            time: roundTime(previous.time + time),
            clueCount: previous.clueCount + clueCount,
            noCount: previous.noCount + noCount,
            found: previous.found || found,
        };
        run.stats = { ...run.stats, [questId]: attempt };

        progress.value.playTime = roundTime(progress.value.playTime + time);
        if (found && !previous.found) {
            const best = progress.value.found[questId]?.bestTime;
            if (best == null || attempt.time < best) {
                progress.value.found[questId] = { bestTime: attempt.time };
            }
        }
        save();
    }

    function questStatus(questId) {
        return statusOf(runStats.value[questId]);
    }

    const runSummary = computed(() => {
        const summary = levelPhotos.value.reduce(
            (sum, quest) => {
                const stat = runStats.value[quest.id];
                if (stat) {
                    sum.found += stat.found ? 1 : 0;
                    sum.time += stat.time;
                    sum.clueCount += stat.clueCount;
                    sum.noCount += stat.noCount;
                }
                return sum;
            },
            { found: 0, count: levelPhotos.value.length, time: 0, clueCount: 0, noCount: 0 },
        );
        return { ...summary, time: roundTime(summary.time) };
    });

    const isRunComplete = computed(() => runSummary.value.count > 0 && runSummary.value.found === runSummary.value.count);

    /** Photos found in a level's run, for the home screen */
    function runProgress(level) {
        const photos = photosForLevel(level);
        const { stats } = runFor(level);
        return { found: photos.filter((quest) => stats[quest.id]?.found).length, total: photos.length };
    }

    // --- Navigation (no wrap-around: the end screen is the last step) ---

    function goToNextQuest() {
        if (currentQuestIndex.value < filteredQuests.value.length - 1) {
            currentQuestIndex.value++;
        }
    }

    function goToPreviousQuest() {
        if (currentQuestIndex.value > 0) {
            currentQuestIndex.value--;
        }
    }

    function setCurrentQuestIndex(index) {
        if (index < 0 || index >= filteredQuests.value.length) {
            return;
        }

        currentQuestIndex.value = index;
    }

    /** Next photo still to search, after the current one then back from the start; -1 when the run is complete */
    function nextToSearchIndex(from = currentQuestIndex.value + 1) {
        return findToSearch(levelPhotos.value, runStats.value, from);
    }

    // Where a find leads: preloaded while the player searches
    const upcomingQuest = computed(() => levelPhotos.value[nextToSearchIndex()] ?? null);

    // After a find: the next photo still to search, or the recap once they are all found
    function goToNextToSearch() {
        const index = nextToSearchIndex();
        currentQuestIndex.value = index === -1 ? photoCount.value : index;
    }

    /** Where a level opens: its recap if the run is complete, else the photo to search from where the player left */
    function resumeIndex(level) {
        const photos = photosForLevel(level);
        const run = runFor(level);
        const from = run.index >= 0 && run.index < photos.length ? run.index : 0;
        const index = findToSearch(photos, run.stats, from);
        return index === -1 ? photos.length : index;
    }

    function openLevel(level) {
        currentDifficultyLevel.value = level;
        currentQuestIndex.value = resumeIndex(level);
    }

    /** "Play again": a fresh run of the current level; best times stay */
    function restartLevel() {
        progress.value.runs[currentDifficultyLevel.value] = { index: 0, stats: {} };
        currentQuestIndex.value = 0;
        save();
    }

    /** A brand new game: every run, best time and play time goes */
    function resetProgress() {
        progress.value = emptyProgress();
        currentQuestIndex.value = 0;
        save();
    }

    // --- Position, for "Resume" on the home screen ---

    function rememberPosition() {
        const level = currentDifficultyLevel.value;
        const index = currentQuestIndex.value;
        ensureRun(level).index = index;

        if (!isRunComplete.value) {
            progress.value.last = { level, index };
        } else if (progress.value.last && String(progress.value.last.level) === String(level)) {
            // A complete level has nothing to resume (but another level may still have)
            progress.value.last = null;
        }
        save();
    }

    // --- Photos found at least once, whatever the run ---

    function isEverFound(questId) {
        return Boolean(progress.value.found[questId]);
    }

    function bestTime(questId) {
        return progress.value.found[questId]?.bestTime ?? null;
    }

    function getLevelPhotos(level) {
        return photosForLevel(level);
    }

    function getTotalCount(level) {
        return photosForLevel(level).length;
    }

    function getCompletedCount(level) {
        return photosForLevel(level).filter((quest) => isEverFound(quest.id)).length;
    }

    return {
        difficultyLevels,
        currentDifficultyLevel,
        currentQuestIndex,
        filteredQuests,
        currentQuest,
        upcomingQuest,
        questsCount,
        photoCount,
        levelPhotos,
        goToNextQuest,
        goToPreviousQuest,
        setCurrentQuestIndex,
        nextToSearchIndex,
        goToNextToSearch,
        resumeIndex,
        openLevel,
        restartLevel,
        resetProgress,
        runStats,
        recordAttempt,
        questStatus,
        runSummary,
        isRunComplete,
        runProgress,
        progress,
        rememberPosition,
        isEverFound,
        bestTime,
        getLevelPhotos,
        getTotalCount,
        getCompletedCount,
    };
});
