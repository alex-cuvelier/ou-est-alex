import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';

export const useQuestsStore = defineStore('quests', () => {
    
    const filteredQuests =  quests.filter((quest) => !quest.hard);
    
    const currentQuestIndex = ref(0);


    const currentQuest = computed(() => filteredQuests[currentQuestIndex.value]);

    const questsCount = computed(() => filteredQuests.length);

    const nextQuest = () => {
        if (currentQuestIndex.value >= filteredQuests.length - 1) {
            currentQuestIndex.value = 0;
            return;
        }

        currentQuestIndex.value++;
    };

    const previousQuest = () => {
        if (currentQuestIndex.value === 0) {
            currentQuestIndex.value = filteredQuests.length - 1;
            return;
        }

        currentQuestIndex.value--;
    };

    const setCurrentQuestIndex = (index) => {
        if (index < 0 || index >= filteredQuests.length) {
            return;
        }

        currentQuestIndex.value = index;
    };

    return { currentQuestIndex, currentQuest, questsCount, nextQuest, previousQuest, setCurrentQuestIndex };
});
