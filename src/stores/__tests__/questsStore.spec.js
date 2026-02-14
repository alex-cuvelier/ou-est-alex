import { setActivePinia, createPinia } from 'pinia';
import { useQuestsStore } from '../questsStore.js';

describe('QuestsStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const store = useQuestsStore();

            expect(store.currentDifficultyLevel).toBe(0);
            expect(store.currentQuestIndex).toBe(0);
            expect(store.questsStats).toEqual([]);
        });
    });

    describe('difficultyLevels', () => {
        it('should return array of difficulty levels', () => {
            const store = useQuestsStore();

            expect(Array.isArray(store.difficultyLevels)).toBe(true);
            expect(store.difficultyLevels.length).toBeGreaterThan(0);
        });
    });

    describe('filteredQuests', () => {
        it('should filter quests by difficulty level', () => {
            const store = useQuestsStore();

            const firstLevel = store.difficultyLevels[0];
            store.currentDifficultyLevel = firstLevel;
            const filtered = store.filteredQuests;

            expect(Array.isArray(filtered)).toBe(true);
            expect(filtered.length).toBeGreaterThan(0);
        });

        it('should return all quests when difficulty is "all"', () => {
            const store = useQuestsStore();

            store.currentDifficultyLevel = 'all';
            const filtered = store.filteredQuests;

            expect(Array.isArray(filtered)).toBe(true);
            expect(filtered.length).toBeGreaterThan(0);
        });
    });

    describe('goToNextQuest', () => {
        it('should increment quest index', () => {
            const store = useQuestsStore();

            const initialIndex = store.currentQuestIndex;

            store.goToNextQuest();

            expect(store.currentQuestIndex).toBe(initialIndex + 1);
        });

        it('should wrap around to 0 at end', () => {
            const store = useQuestsStore();

            const lastIndex = store.filteredQuests.length - 1;
            store.currentQuestIndex = lastIndex;

            store.goToNextQuest();

            expect(store.currentQuestIndex).toBe(0);
        });
    });

    describe('goToPreviousQuest', () => {
        it('should decrement quest index', () => {
            const store = useQuestsStore();

            store.currentQuestIndex = 2;

            store.goToPreviousQuest();

            expect(store.currentQuestIndex).toBe(1);
        });

        it('should wrap around to end at beginning', () => {
            const store = useQuestsStore();

            store.currentQuestIndex = 0;
            const maxIndex = store.filteredQuests.length - 1;

            store.goToPreviousQuest();

            expect(store.currentQuestIndex).toBe(maxIndex);
        });
    });

    describe('setCurrentQuestIndex', () => {
        it('should set quest index when valid', () => {
            const store = useQuestsStore();

            store.setCurrentQuestIndex(1);

            expect(store.currentQuestIndex).toBe(1);
        });

        it('should not set index when negative', () => {
            const store = useQuestsStore();

            store.currentQuestIndex = 1;

            store.setCurrentQuestIndex(-1);

            expect(store.currentQuestIndex).toBe(1);
        });

        it('should not set index when out of bounds', () => {
            const store = useQuestsStore();

            store.currentQuestIndex = 1;

            store.setCurrentQuestIndex(999);

            expect(store.currentQuestIndex).toBe(1);
        });
    });

    describe('pushQuestStats', () => {
        it('should add quest stats to array', () => {
            const store = useQuestsStore();

            const stat = {
                questId: 1,
                found: true,
                clueCount: 2,
                noCount: 3,
            };

            store.pushQuestStats(stat);

            expect(store.questsStats).toHaveLength(1);
            expect(store.questsStats[0]).toEqual(stat);
        });
    });

    describe('resetQuests', () => {
        it('should reset stats and index', () => {
            const store = useQuestsStore();

            store.currentQuestIndex = 5;
            store.pushQuestStats({ id: 1, found: true });

            store.resetQuests();

            expect(store.currentQuestIndex).toBe(0);
            expect(store.questsStats).toEqual([]);
        });
    });
});
