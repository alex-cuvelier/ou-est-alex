import { setActivePinia, createPinia } from 'pinia';
import { useQuestsStore, SEARCH_THRESHOLD } from '../questsStore.js';

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

        it('should not count a glance as a missed photo', () => {
            const store = useQuestsStore();
            const [first, second] = store.levelPhotos;

            store.recordAttempt(first.id, { time: 2 });
            expect(store.questStatus(first.id)).toBe('todo');

            store.recordAttempt(first.id, { time: SEARCH_THRESHOLD - 2 });
            expect(store.questStatus(first.id)).toBe('missed');

            store.recordAttempt(second.id, { time: 1, clueCount: 1 });
            expect(store.questStatus(second.id)).toBe('missed');
        });

        it('should keep times to the tenth of a second', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;

            store.recordAttempt(id, { time: 0.1 });
            store.recordAttempt(id, { time: 0.2 });

            expect(store.runStats[id].time).toBe(0.3);
            expect(store.progress.playTime).toBe(0.3);
        });

        it('should record a visit in the level it was made in', () => {
            const store = useQuestsStore();
            const id = store.getLevelPhotos(0)[0].id;
            store.currentDifficultyLevel = 1;

            store.recordAttempt(id, { time: 10, found: true }, 0);

            expect(store.runStats[id]).toBeUndefined();
            expect(store.runProgress(0).found).toBe(1);
        });
    });

    describe('next photo to search', () => {
        it('should skip the photos already found', () => {
            const store = useQuestsStore();
            store.currentDifficultyLevel = 1;
            const photos = store.levelPhotos;
            store.recordAttempt(photos[1].id, { time: 10, found: true });

            store.recordAttempt(photos[0].id, { time: 10, found: true });
            store.goToNextToSearch();

            expect(store.currentQuestIndex).toBe(2);
        });

        it('should go back to the first photo left after the last one', () => {
            const store = useQuestsStore();
            store.currentDifficultyLevel = 1;
            const lastIndex = store.photoCount - 1;
            store.currentQuestIndex = lastIndex;

            store.recordAttempt(store.levelPhotos[lastIndex].id, { time: 10, found: true });
            store.goToNextToSearch();

            expect(store.currentQuestIndex).toBe(0);
            expect(store.isRunComplete).toBe(false);
        });

        it('should show the recap once every photo is found', () => {
            const store = useQuestsStore();
            findAll(store);

            store.goToNextToSearch();

            expect(store.currentQuestIndex).toBe(store.photoCount);
            expect(store.currentQuest.type).toBe('end');
            expect(store.isRunComplete).toBe(true);
            expect(store.nextToSearchIndex(0)).toBe(-1);
        });

        it('should give the first photo left, for the recap', () => {
            const store = useQuestsStore();
            store.recordAttempt(store.levelPhotos[0].id, { time: 10, found: true });

            expect(store.nextToSearchIndex(0)).toBe(1);
        });
    });

    describe('runs', () => {
        it('should keep the run across sessions', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;
            store.recordAttempt(id, { time: 40, clueCount: 1, found: true });

            setActivePinia(createPinia());
            const reloaded = useQuestsStore();

            expect(reloaded.questStatus(id)).toBe('found');
            expect(reloaded.runSummary).toMatchObject({ found: 1, time: 40, clueCount: 1 });
        });

        it('should start a level with the photos already found in another one', () => {
            const store = useQuestsStore();
            const id = store.getLevelPhotos(1)[0].id;
            store.currentDifficultyLevel = 'all';
            store.recordAttempt(id, { time: 30, found: true });

            store.openLevel(1);

            expect(store.runProgress(1).found).toBe(1);
            expect(store.questStatus(id)).toBe('found');
            expect(store.currentQuestIndex).toBe(1);
        });

        it('should open a level where its run was left', () => {
            const store = useQuestsStore();
            store.openLevel(1);
            store.currentQuestIndex = 3;
            store.rememberPosition();

            store.openLevel(2);
            expect(store.currentQuestIndex).toBe(0);

            store.openLevel(1);
            expect(store.currentQuestIndex).toBe(3);
        });

        it('should resume on the next photo to search', () => {
            const store = useQuestsStore();
            store.openLevel(1);
            store.currentQuestIndex = 3;
            store.rememberPosition();
            store.recordAttempt(store.levelPhotos[3].id, { time: 10, found: true });

            store.openLevel(2);
            store.openLevel(1);

            expect(store.currentQuestIndex).toBe(4);
        });

        it('should open the recap of a complete level', () => {
            const store = useQuestsStore();
            findAll(store);

            store.openLevel(1);
            store.openLevel(0);

            expect(store.currentQuest.type).toBe('end');
        });

        it('should restart a level and keep the best times', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;
            store.recordAttempt(id, { time: 40, found: true });
            store.currentQuestIndex = 2;

            store.restartLevel();

            expect(store.currentQuestIndex).toBe(0);
            expect(store.runStats).toEqual({});
            expect(store.bestTime(id)).toBe(40);
            expect(store.getCompletedCount(0)).toBe(1);
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
        });

        it('should keep the best time', () => {
            const store = useQuestsStore();
            const id = store.levelPhotos[0].id;

            store.recordAttempt(id, { time: 40, found: true });
            store.restartLevel();
            store.recordAttempt(id, { time: 25, found: true });
            store.restartLevel();
            store.recordAttempt(id, { time: 60, found: true });

            expect(store.bestTime(id)).toBe(25);
        });

        it('should remember the resume position until the level is complete', () => {
            const store = useQuestsStore();
            store.currentQuestIndex = 3;

            store.rememberPosition();
            expect(JSON.parse(storage.data['oea-progress']).last).toEqual({ level: 0, index: 3 });

            findAll(store);
            store.rememberPosition();
            expect(store.progress.last).toBeNull();
        });

        it("should keep another level's resume position when viewing a complete one", () => {
            const store = useQuestsStore();
            findAll(store);
            store.openLevel(1);
            store.rememberPosition();

            store.openLevel(0);
            store.rememberPosition();

            expect(store.progress.last).toEqual({ level: 1, index: 0 });
        });
    });
});

function findAll(store) {
    for (const quest of store.levelPhotos) {
        store.recordAttempt(quest.id, { time: 10, found: true });
    }
}
