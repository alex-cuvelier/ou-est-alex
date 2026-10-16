import { emptyProgress, loadProgress, saveProgress } from '../progress.js';

function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = String(value);
        },
        data,
    };
}

describe('progress', () => {
    it('should start empty when nothing is saved', () => {
        expect(loadProgress(memoryStorage())).toEqual(emptyProgress());
    });

    it('should save and load progress', () => {
        const storage = memoryStorage();
        const progress = { found: { 12: { bestTime: 42 } }, playTime: 300, last: { level: 1, index: 2 } };

        saveProgress(progress, storage);

        expect(loadProgress(storage)).toEqual(progress);
    });

    it('should ignore corrupted data', () => {
        expect(loadProgress(memoryStorage({ 'oea-progress': '{not json' }))).toEqual(emptyProgress());
    });

    it('should not throw when storage is unavailable', () => {
        const failing = {
            getItem: () => {
                throw new Error('SecurityError');
            },
            setItem: () => {
                throw new Error('QuotaExceededError');
            },
        };

        expect(loadProgress(failing)).toEqual(emptyProgress());
        expect(() => saveProgress(emptyProgress(), failing)).not.toThrow();
        expect(loadProgress(undefined)).toEqual(emptyProgress());
    });
});
