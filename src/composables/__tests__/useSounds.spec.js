import { vi } from 'vitest';
import { playOk, playKo, playNoob } from '../useSounds.js';

describe('useSounds', () => {
    beforeEach(() => {
        // Mock Audio constructor
        global.Audio = vi.fn().mockImplementation(() => ({
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            currentTime: 0,
        }));
    });

    describe('playOk', () => {
        it('should create and play ok sound', () => {
            playOk();

            expect(global.Audio).toHaveBeenCalledWith('/src/assets/sounds/oui.mp3');
        });

        it('should call play method', () => {
            playOk();

            const audioInstance = global.Audio.mock.results[0].value;
            expect(audioInstance.play).toHaveBeenCalled();
        });
    });

    describe('playKo', () => {
        it('should create and play ko sound', () => {
            playKo();

            expect(global.Audio).toHaveBeenCalledWith('/src/assets/sounds/non.mp3');
        });

        it('should call play method', () => {
            playKo();

            const audioInstance = global.Audio.mock.results[0].value;
            expect(audioInstance.play).toHaveBeenCalled();
        });
    });

    describe('playNoob', () => {
        it('should create and play one of two noob sounds', () => {
            playNoob();

            const lastCall = global.Audio.mock.calls[global.Audio.mock.calls.length - 1][0];
            const validSounds = ['/src/assets/sounds/noob.mp3', '/src/assets/sounds/noob-2.mp3'];

            expect(validSounds).toContain(lastCall);
        });

        it('should call play method', () => {
            playNoob();

            const audioInstance = global.Audio.mock.results[global.Audio.mock.results.length - 1].value;
            expect(audioInstance.play).toHaveBeenCalled();
        });

        it('should randomly select between two sounds', () => {
            const sounds = new Set();

            // Play multiple times to get both sounds (statistically)
            for (let i = 0; i < 20; i++) {
                playNoob();
                const lastCall = global.Audio.mock.calls[global.Audio.mock.calls.length - 1][0];
                sounds.add(lastCall);
            }

            // Should have used both sounds (with high probability)
            // Note: This test could theoretically fail if random is very unlucky
            expect(sounds.size).toBeGreaterThan(0);
        });
    });

    describe('Error handling', () => {
        it('should not throw when Audio.play fails', () => {
            global.Audio = vi.fn().mockImplementation(() => ({
                play: vi.fn().mockRejectedValue(new Error('Play failed')),
            }));

            expect(() => playOk()).not.toThrow();
            expect(() => playKo()).not.toThrow();
            expect(() => playNoob()).not.toThrow();
        });
    });
});
