import Confetti from 'vue-confetti/src/confetti';
const instance = new Confetti();

export default {
    start: () =>
        instance.start({
            particlesPerFrame: 0.4,
            defaultSize: 40,
            defaultDropRate: 20,
            windSpeedMax: 2,
            particles: [
                {
                    type: 'image',
                    url: '/images/particules/bravo-1.png'
                },
                {
                    type: 'image',
                    url: '/images/particules/bravo-2.png'
                },
                {
                    type: 'image',
                    url: '/images/particules/bravo-3.png'
                },
                {
                    type: 'image',
                    url: '/images/particules/bravo-4.png'
                },
                {
                    type: 'image',
                    url: '/images/particules/bravo-5.png'
                },
                {
                    type: 'image',
                    url: '/images/particules/bravo-6.png'
                },
            ]
        }),
    stop: () => instance.stop(),
};
