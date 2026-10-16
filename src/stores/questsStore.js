import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';
import { loadProgress, saveProgress } from '@/utils/progress.js';

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

export const useQuestsStore = defineStore('quests', () => {
    const difficultyLevels = computed(() =>
        Array.from(new Set(playableQuests.filter((quest) => quest.difficultyLevel != null).map((quest) => quest.difficultyLevel))).sort((a, b) => a - b),
    );

    const currentDifficultyLevel = ref(0);
    const currentQuestIndex = ref(0);

    const filteredQuests = computed(() => questsForLevel(currentDifficultyLevel.value));
    const currentQuest = computed(() => filteredQuests.value[currentQuestIndex.value]);
    const nextQuest = computed(() => filteredQuests.value[currentQuestIndex.value + 1]);

    // Including the end screen
    const questsCount = computed(() => filteredQuests.value.length);
    // Photos only
    const photoCount = computed(() => filteredQuests.value.length - 1);
    const levelPhotos = computed(() => filteredQuests.value.slice(0, -1));

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

    // --- Current run: one entry per photo, summed over visits ---

    const runStats = ref({});

    /**
     * Records the time and counters spent on a photo when leaving it.
     * Visiting the same photo again adds up; a photo stays found once found.
     */
    function recordAttempt(questId, { time = 0, clueCount = 0, noCount = 0, found = false }) {
        if (!questId || questId === 'end') {
            return;
        }

        const previous = runStats.value[questId] ?? { time: 0, clueCount: 0, noCount: 0, found: false };
        const attempt = {
            time: previous.time + time,
            clueCount: previous.clueCount + clueCount,
            noCount: previous.noCount + noCount,
            found: previous.found || found,
        };
        runStats.value = { ...runStats.value, [questId]: attempt };

        progress.value.playTime += time;
        if (found && !previous.found) {
            const best = progress.value.found[questId]?.bestTime;
            if (best == null || attempt.time < best) {
                progress.value.found[questId] = { bestTime: attempt.time };
            }
        }
        saveProgress(progress.value);
    }

    /** 'found' | 'missed' (visited, not found) | 'todo' (not visited in this run) */
    function questStatus(questId) {
        const stat = runStats.value[questId];
        if (!stat) {
            return 'todo';
        }
        return stat.found ? 'found' : 'missed';
    }

    const runSummary = computed(() =>
        levelPhotos.value.reduce(
            (summary, quest) => {
                const stat = runStats.value[quest.id];
                if (stat) {
                    summary.found += stat.found ? 1 : 0;
                    summary.time += stat.time;
                    summary.clueCount += stat.clueCount;
                    summary.noCount += stat.noCount;
                }
                return summary;
            },
            { found: 0, count: levelPhotos.value.length, time: 0, clueCount: 0, noCount: 0 },
        ),
    );

    function resetQuests() {
        runStats.value = {};
        currentQuestIndex.value = 0;
    }

    /** Switches level and starts a fresh run on its first photo */
    function startLevel(level) {
        currentDifficultyLevel.value = level;
        resetQuests();
    }

    // --- Saved progress, kept between visits ---

    const progress = ref(loadProgress());

    function rememberPosition() {
        progress.value.last = { level: currentDifficultyLevel.value, index: currentQuestIndex.value };
        saveProgress(progress.value);
    }

    // Called on the end screen: a finished level has nothing to resume
    function clearPosition() {
        progress.value.last = null;
        saveProgress(progress.value);
    }

    function isEverFound(questId) {
        return Boolean(progress.value.found[questId]);
    }

    function bestTime(questId) {
        return progress.value.found[questId]?.bestTime ?? null;
    }

    function getLevelPhotos(level) {
        return questsForLevel(level).slice(0, -1);
    }

    function getTotalCount(level) {
        return getLevelPhotos(level).length;
    }

    function getCompletedCount(level) {
        return getLevelPhotos(level).filter((quest) => isEverFound(quest.id)).length;
    }

    return {
        difficultyLevels,
        currentDifficultyLevel,
        currentQuestIndex,
        filteredQuests,
        currentQuest,
        nextQuest,
        questsCount,
        photoCount,
        levelPhotos,
        goToNextQuest,
        goToPreviousQuest,
        setCurrentQuestIndex,
        runStats,
        recordAttempt,
        questStatus,
        runSummary,
        resetQuests,
        startLevel,
        progress,
        rememberPosition,
        clearPosition,
        isEverFound,
        bestTime,
        getLevelPhotos,
        getTotalCount,
        getCompletedCount,
    };
});
