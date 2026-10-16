import { setActivePinia, createPinia } from 'pinia';
import { useQuestsStore } from '../questsStore.js';

function memoryStorage() {
    const data = {};
    return {
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = String(value);
        },
        data,
    };
}

describe('QuestsStore', () => {
    let storage;

    beforeEach(() => {
        storage = memoryStorage();
        vi.stubGlobal('localStorage', storage);
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const store = useQuestsStore();

            expect(store.currentDifficultyLevel).toBe(0);
            expect(store.currentQuestIndex).toBe(0);
            expect(store.runStats).toEqual({});
        });
    });

    describe('difficultyLevels', () => {
        it('should return sorted difficulty levels', () => {
            const store = useQuestsStore();

            expect(store.difficultyLevels.length).toBeGreaterThan(0);
            expect([...store.difficultyLevels].sort((a, b) => a - b)).toEqual(store.difficultyLevels);
        });
    });

    describe('filteredQuests', () => {
        it('should keep only the level photos, then the end screen', () => {
            const store = useQuestsStore();
            store.currentDifficultyLevel = 1;

            const photos = store.filteredQuests.slice(0, -1);
            expect(photos.length).toBeGreaterThan(0);
            expect(photos.every((quest) => quest.difficultyLevel === 1 && quest.type === 'quest')).toBe(true);
            expect(store.filteredQuests.at(-1).type).toBe('end');
            expect(store.photoCount).toBe(photos.length);
        });

        it('should return every photo when difficulty is "all"', () => {
            const store = useQuestsStore();
            store.currentDifficultyLevel = 'all';

            const levelsTotal = store.difficultyLevels.reduce((sum, level) => sum + store.getTotalCount(level), 0);
            expect(store.photoCount).toBe(levelsTotal);
        });

        it('should use string ids', () => {
            const store = useQuestsStore();

            expect(store.levelPhotos.every((quest) => typeof quest.id === 'string')).toBe(true);
        });
    });

    describe('navigation', () => {
        it('should go to the next photo, up to the end screen', () => {
            const store = useQuestsStore();
            const lastIndex = store.filteredQuests.length - 1;

            store.goToNextQuest();
            expect(store.currentQuestIndex).toBe(1);

            store.currentQuestIndex = lastIndex;
            store.goToNextQuest();
            expect(store.currentQuestIndex).toBe(lastIndex);
        });

        it('should not wrap to the end screen from the first photo', () => {
            const store = useQuestsStore();

            store.goToPreviousQuest();

            expect(store.currentQuestIndex).toBe(0);
        });

        it('should ignore out of bounds indexes', () => {
            const store = useQuestsStore();
            store.setCurrentQuestIndex(1);

            store.setCurrentQuestIndex(-1);
            store.setCurrentQuestIndex(999);

            expect(store.currentQuestIndex).toBe(1);
        });
    });

    describe('run stats', () => {
        it('should mark a found photo as found', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;

            store.recordAttempt(id, { time: 12, clueCount: 1, noCount: 2, found: true });

            expect(store.questStatus(id)).toBe('found');
            expect(store.questStatus(store.levelPhotos[1].id)).toBe('todo');
        });

        it('should add up visits and keep a photo found', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;

            store.recordAttempt(id, { time: 10, noCount: 1 });
            expect(store.questStatus(id)).toBe('missed');

            store.recordAttempt(id, { time: 5, clueCount: 1, found: true });
            store.recordAttempt(id, { time: 3 });

            expect(store.runStats[id]).toEqual({ time: 18, clueCount: 1, noCount: 1, found: true });
        });

        it('should summarize the current level only', () => {
            const store = useQuestsStore();
            const [first, second] = store.levelPhotos;

            store.recordAttempt(first.id, { time: 30, clueCount: 2, noCount: 1, found: true });
            store.recordAttempt(second.id, { time: 15, noCount: 3 });

            expect(store.runSummary).toEqual({ found: 1, count: store.photoCount, time: 45, clueCount: 2, noCount: 4 });
        });

        it('should ignore the end screen', () => {
            const store = useQuestsStore();

            store.recordAttempt('end', { time: 10, found: true });

            expect(store.runStats).toEqual({});
        });

        it('should reset the run when starting a level', () => {
            const store = useQuestsStore();
            store.recordAttempt(store.levelPhotos[0].id, { time: 10, found: true });
            store.currentQuestIndex = 2;

            store.startLevel(2);

            expect(store.currentDifficultyLevel).toBe(2);
            expect(store.currentQuestIndex).toBe(0);
            expect(store.runStats).toEqual({});
        });
    });

    describe('saved progress', () => {
        it('should keep found photos and play time across sessions', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;
            store.recordAttempt(id, { time: 40, found: true });

            setActivePinia(createPinia());
            const reloaded = useQuestsStore();

            expect(reloaded.isEverFound(id)).toBe(true);
            expect(reloaded.bestTime(id)).toBe(40);
            expect(reloaded.progress.playTime).toBe(40);
            expect(reloaded.getCompletedCount(0)).toBe(1);
            expect(reloaded.questStatus(id)).toBe('todo');
        });

        it('should keep the best time', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;

            store.recordAttempt(id, { time: 40, found: true });
            store.startLevel(0);
            store.recordAttempt(id, { time: 25, found: true });
            store.startLevel(0);
            store.recordAttempt(id, { time: 60, found: true });

            expect(store.bestTime(id)).toBe(25);
        });

        it('should remember and clear the resume position', () => {
            const store = useQuestsStore();
            store.currentDifficultyLevel = 1;
            store.currentQuestIndex = 3;

            store.rememberPosition();
            expect(JSON.parse(storage.data['oea-progress']).last).toEqual({ level: 1, index: 3 });

            store.clearPosition();
            expect(store.progress.last).toBeNull();
        });
    });
});
