import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * UI state shared between the app shell and the views
 * (e.g. the quest timer pauses while the instructions are open).
 */
export const useUiStore = defineStore('ui', () => {
    const instructionsVisible = ref(false);

    return { instructionsVisible };
});
