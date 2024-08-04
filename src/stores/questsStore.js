import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';

export const useQuestsStore = defineStore('quests', () => {
    
    const filteredQuests = quests
        .sort((a, b) => a.difficultyLevel - b.difficultyLevel)
        .filter((quest) => quest.difficultyLevel < 4 || quest.type === 'end')
        .map((quest, index) => ({
            id: index,
            type: 'quest',
            ...quest,
        }));

    const currentQuestIndex = ref(0);

    const questsStats = ref([]);

    const currentQuest = computed(() => filteredQuests[currentQuestIndex.value]);

    const nextQuest = computed(() => filteredQuests[currentQuestIndex.value + (1 % filteredQuests.length)]);

    const questsCount = computed(() => filteredQuests.length);

    function goToNextQuest() {
        if (currentQuestIndex.value >= filteredQuests.length - 1) {
            currentQuestIndex.value = 0;
            return;
        }

        currentQuestIndex.value++;
    }

    function goToPreviousQuest() {
        if (currentQuestIndex.value === 0) {
            currentQuestIndex.value = filteredQuests.length - 1;
            return;
        }

        currentQuestIndex.value--;
    }

    function setCurrentQuestIndex(index) {
        if (index < 0 || index >= filteredQuests.length) {
            return;
        }

        currentQuestIndex.value = index;
    }

    function pushQuestStats(questStat) {
        questsStats.value.push(questStat);
    }

    function resetQuests() {
        questsStats.value = [];
        currentQuestIndex.value = 0;
    }

    return { currentQuestIndex, currentQuest, nextQuest, questsCount, questsStats, goToNextQuest, goToPreviousQuest, setCurrentQuestIndex, pushQuestStats, resetQuests };
});
