import okSound from '@/assets/sounds/oui.mp3';
import non from '@/assets/sounds/non.mp3';
import non3 from '@/assets/sounds/non-3.mp3';
import non4 from '@/assets/sounds/non-4.mp3';
import non5 from '@/assets/sounds/non-5.mp3';
import non6 from '@/assets/sounds/non-6.mp3';
import non7 from '@/assets/sounds/non-7.mp3';
import non8 from '@/assets/sounds/non-8.mp3';
import non9 from '@/assets/sounds/non-9.mp3';
import non10 from '@/assets/sounds/non-10.mp3';
import noobSound from '@/assets/sounds/noob.mp3';
import noob2Sound from '@/assets/sounds/noob-2.mp3';

const noobArray = [noobSound, noob2Sound];
const nonArray = [non,non,non,non,non,non, non3, non4, non5, non6, non7, non8, non9, non10];
export const playOk = () => playSound(okSound);
export const playKo = () => playSound(nonArray[Math.floor(Math.random() * nonArray.length)]);
export const playNoob = () => playSound(noobArray[Math.floor(Math.random() * noobArray.length)]);

function playSound(sound) {
    let audio = new Audio(sound);
    audio.play();
}
