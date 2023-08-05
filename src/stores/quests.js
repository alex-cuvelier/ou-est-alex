import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import quests from '@/quests.json';

export const useQuestsStore = defineStore('quests', () => {

    const currentQuestIndex = ref(0);

    const currentQuest = computed(() => quests[currentQuestIndex.value]);
    
    const questsCount = computed(() => quests.length);

    const nextQuest = () => {
        if (currentQuestIndex.value >= quests.length -1) {
            currentQuestIndex.value = 0;
            return;
        }

        currentQuestIndex.value++;
    };

    const previousQuest = () => {
        if (currentQuestIndex.value === 0) {
            currentQuestIndex.value = quests.length - 1;
            return;
        }

        currentQuestIndex.value--;
    };

    const setCurrentQuestIndex = (index) => {
        if (index < 0 || index >= quests.length) {
            return;
        }

        currentQuestIndex.value = index;
    }

    return { currentQuestIndex, currentQuest, questsCount,  nextQuest, previousQuest, setCurrentQuestIndex };
});
