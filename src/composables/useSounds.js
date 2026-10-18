/**
 * Game sounds through Web Audio: each file is decoded once, ahead of time, and played from
 * memory, so it comes out the moment it is asked for. An audio element first loads its file
 * on every play, a delay that phones make clearly heard.
 * Until the files are decoded, or without Web Audio, a sound plays through an audio element.
 */
import okSound from '@/assets/sounds/oui.mp3';
import non from '@/assets/sounds/non.mp3';
import noobSound from '@/assets/sounds/noob.mp3';
import noob2Sound from '@/assets/sounds/noob-2.mp3';

const noobArray = [noobSound, noob2Sound];
export const playOk = () => playSound(okSound);
export const playKo = () => playSound(non);
export const playNoob = () => playSound(noobArray[Math.floor(Math.random() * noobArray.length)]);

const AudioContextClass = typeof window === 'undefined' ? undefined : window.AudioContext ?? window.webkitAudioContext;

let context = null;
const buffers = new Map(); // Decoded sounds, by file URL

// Browsers only start a page's audio on a gesture: created on the first one, resumed on the next ones if the system suspended it
function unlock() {
    if (!context) {
        context = new AudioContextClass();
        for (const url of [okSound, non, ...noobArray]) {
            fetch(url)
                .then((response) => response.arrayBuffer())
                .then((data) => context.decodeAudioData(data))
                .then((buffer) => buffers.set(url, buffer))
                .catch(() => {}); // That sound stays on its audio element
        }
    }
    if (context.state !== 'running') {
        context.resume().catch(() => {});
    }
}

if (AudioContextClass) {
    for (const type of ['pointerup', 'touchend', 'keydown']) {
        window.addEventListener(type, unlock, { capture: true, passive: true });
    }
}

function playSound(sound) {
    const buffer = buffers.get(sound);
    if (!buffer || context.state !== 'running') {
        new Audio(sound).play().catch(() => {});
        return;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
}
