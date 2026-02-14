import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';

export const useQuestsStore = defineStore('quests', () => {
    const difficultyLevels = computed(() => {
        return Array.from(
            new Set(
                quests
                    .filter((quest) => quest.difficultyLevel != null)
                    .map((quest) => quest.difficultyLevel)
                    .sort(),
            ),
        );
    });

    const currentDifficultyLevel = ref(0);

    const filteredQuests = computed(() => {
        if (currentDifficultyLevel.value === 'all') {
            return quests.map((quest, index) => ({
                id: index,
                type: 'quest',
                ...quest,
            }));
        }

        return [...quests]
            .sort((a, b) => a.difficultyLevel - b.difficultyLevel)
            .filter((quest) => quest.difficultyLevel == currentDifficultyLevel.value || quest.type === 'end')
            .map((quest, index) => ({
                id: index,
                type: 'quest',
                ...quest,
            }));
    });

    const currentQuestIndex = ref(0);

    const questsStats = ref([]);

    const currentQuest = computed(() => filteredQuests.value[currentQuestIndex.value]);

    const nextQuest = computed(() => filteredQuests.value[currentQuestIndex.value + (1 % filteredQuests.value.length)]);

    const questsCount = computed(() => filteredQuests.value.length);

    function goToNextQuest() {
        if (currentQuestIndex.value >= filteredQuests.value.length - 1) {
            currentQuestIndex.value = 0;
            return;
        }

        currentQuestIndex.value++;
    }

    function goToPreviousQuest() {
        if (currentQuestIndex.value === 0) {
            currentQuestIndex.value = filteredQuests.value.length - 1;
            return;
        }

        currentQuestIndex.value--;
    }

    function setCurrentQuestIndex(index) {
        if (index < 0 || index >= filteredQuests.value.length) {
            return;
        }

        currentQuestIndex.value = index;
    }

    function pushQuestStats(questStat) {
        questsStats.value.push(questStat);
    }

    function isQuestCompleted(questId) {
        return questsStats.value.some((questStat) => questStat.id === questId && questStat.found);
    }

    function isQuestFailed(questId) {
        return questsStats.value.some((questStat) => questStat.id === questId && !questStat.found);
    }

    function resetQuests() {
        questsStats.value = [];
        currentQuestIndex.value = 0;
    }

    function getCompletedCount(difficultyLevel) {
        return questsStats.value.filter((questStat) => {
            const quest = quests.find((q) => q.id == questStat.questId);
            return questStat.found && (difficultyLevel == 'all' || quest?.difficultyLevel == difficultyLevel);
        }).length;
    }

    function getTotalCount(difficultyLevel) {
        return quests.filter((q) => q.type != 'end' && (difficultyLevel == 'all' || q.difficultyLevel == difficultyLevel)).length;
    }

    return {
        currentDifficultyLevel,
        difficultyLevels,
        currentQuestIndex,
        currentQuest,
        nextQuest,
        questsCount,
        questsStats,
        goToNextQuest,
        goToPreviousQuest,
        setCurrentQuestIndex,
        pushQuestStats,
        isQuestCompleted,
        isQuestFailed,
        resetQuests,
        getCompletedCount,
        getTotalCount,
    };
});
