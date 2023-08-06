import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';

export const useQuestsStore = defineStore('quests', () => {
    const filteredQuests = quests
        .filter((quest) => !quest.hard)
        .map((quest, index) => ({
            id: index,
            type: 'quest',
            ...quest,
        }));

    const currentQuestIndex = ref(0);

    const questsStats = ref([]);

    const currentQuest = computed(() => filteredQuests[currentQuestIndex.value]);

    const questsCount = computed(() => filteredQuests.length);

    function nextQuest(questStat) {
        if (currentQuestIndex.value >= filteredQuests.length - 1) {
            currentQuestIndex.value = 0;
            return;
        }

        if (questStat) {
            questsStats.value.push(questStat);
        }

        currentQuestIndex.value++;
    }

    function previousQuest() {
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

    function resetQuests() {
        questsStats.value = [];
        currentQuestIndex.value = 0;
    }

    return { currentQuestIndex, currentQuest, questsCount, questsStats, nextQuest, previousQuest, setCurrentQuestIndex, resetQuests };
});
