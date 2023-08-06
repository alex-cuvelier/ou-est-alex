import okSound from '@/assets/sounds/oui.mp3';
import koSound from '@/assets/sounds/non.mp3';
import noobSound from '@/assets/sounds/noob.mp3';

export const playOk = () => playSound(okSound);
export const playKo = () => playSound(koSound);
export const playNoob = () => playSound(noobSound);

function playSound(sound){
    let audio = new Audio(sound);
    audio.play();
}