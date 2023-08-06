import okSound from '@/assets/sounds/oui.mp3';
import non from '@/assets/sounds/non.mp3';
import noobSound from '@/assets/sounds/noob.mp3';
import noob2Sound from '@/assets/sounds/noob-2.mp3';

const noobArray = [noobSound, noob2Sound];
export const playOk = () => playSound(okSound);
export const playKo = () => playSound(non);
export const playNoob = () => playSound(noobArray[Math.floor(Math.random() * noobArray.length)]);

function playSound(sound) {
    let audio = new Audio(sound);
    audio.play();
}
