/**
 * Confetti of Alex heads, above the photo.
 *
 *   burst(x, y)   a find: a fountain of heads from the spot where Alex was hiding
 *   celebrate()   a level complete: two cannons from the bottom corners, in two waves
 *   clear()       everything off the screen at once
 *
 * Each head flies, spins and falls under gravity and air drag, then fades out. Its whole
 * path is computed at launch and handed to the browser as a transform/opacity animation,
 * which the GPU plays on its own: nothing runs on the page's thread while the heads fly,
 * so they stay smooth on a phone, and while the photo zooms in.
 * Speeds follow the screen height, so a phone and a desktop get the same show.
 * Nothing is shown when the device asks for reduced motion.
 */

const IMAGES = [1, 2, 3, 4, 5, 6].map((n) => `/images/particules/bravo-${n}.webp`);

const GRAVITY = 1100; // px/s²
const DRAG = 2.2; // per second: heads fall at GRAVITY / DRAG = 500 px/s at most
const POP = 0.18; // s, a head grows to its size when launched
const FADE = 0.4; // s, a head fades out at the end of its life
// s between two keyframes of a path: the browser draws straight lines in between, where
// a path turns by less than 3°; denser keyframes only cost more to set up at launch
const STEP = 1 / 20;

// Loaded with the game, so that the very first find already has its heads
if (typeof Image !== 'undefined') {
    for (const url of IMAGES) {
        new Image().src = url;
    }
}

let layer = null;

// --- Utilities ---

function random(min, max) {
    return min + Math.random() * (max - min);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// --- Layer: on the page only while heads are flying ---

function getLayer() {
    if (!layer) {
        layer = document.createElement('div');
        layer.setAttribute('aria-hidden', 'true');
        // No z-index: above the photo, under what sets one (top pills, dock, found card)
        layer.style.cssText = 'position: fixed; inset: 0; overflow: hidden; pointer-events: none;';
        document.body.appendChild(layer);
    }
    return layer;
}

function clear() {
    if (!layer) {
        return;
    }
    for (const animation of layer.getAnimations({ subtree: true })) {
        animation.cancel();
    }
    layer.remove();
    layer = null;
}

// --- Heads ---

/**
 * The flight of a head, as keyframes: centered on (x, y), it spins, sways like a coin
 * turning (never mirrored), pops in at launch and fades out at the end of its life.
 * Ends once faded out or below the screen.
 */
function flight({ x, y, vx, vy, size, life }, screenHeight) {
    let rotation = random(-0.5, 0.5);
    let wobble = random(0, Math.PI * 2);
    const spin = random(1.5, 5) * (Math.random() < 0.5 ? -1 : 1); // rad/s
    const wobbleSpeed = random(4, 9); // rad/s
    const drag = Math.exp(-DRAG * STEP);
    const keyframes = [];

    for (let age = 0; ; age += STEP) {
        const pop = age < POP ? 0.3 + 0.7 * easeOutCubic(age / POP) : 1;
        const scaleX = pop * (0.75 + 0.25 * Math.cos(wobble));
        keyframes.push({
            transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation.toFixed(3)}rad) scale(${scaleX.toFixed(3)}, ${pop.toFixed(
                3,
            )}) translate(-50%, -50%)`,
            opacity: age === 0 ? 0 : Math.max(0, Math.min(1, (life - age) / FADE)),
        });
        if (age >= life || y - size / 2 > screenHeight) {
            return keyframes;
        }
        vx *= drag;
        vy = vy * drag + GRAVITY * STEP;
        x += vx * STEP;
        y += vy * STEP;
        rotation += spin * STEP;
        wobble += wobbleSpeed * STEP;
    }
}

function launch({ x, y, angle, speed, delay = 0, life = random(2.4, 3.2) }) {
    const stage = getLayer();
    const size = random(44, 72); // Height in px, the width follows the image
    const head = document.createElement('img');
    head.src = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    head.alt = '';
    head.draggable = false;
    // Hidden unless animated: before its delay is over (fill backwards), and once landed
    head.style.cssText = `position: absolute; left: 0; top: 0; height: ${size}px; transform-origin: 0 0; opacity: 0;`;
    stage.appendChild(head);

    const keyframes = flight({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, life }, stage.clientHeight);
    const animation = head.animate(keyframes, {
        duration: (keyframes.length - 1) * STEP * 1000,
        delay: delay * 1000,
        fill: 'backwards',
    });
    animation.onfinish = () => {
        head.remove();
        if (layer && !layer.childElementCount) {
            clear();
        }
    };
}

// --- Public API ---

/** A find: heads spring up from (x, y), in viewport coordinates */
function burst(x, y) {
    if (prefersReducedMotion()) {
        return;
    }
    const height = getLayer().clientHeight;
    for (let i = 0; i < 22; i++) {
        // A V, 30° to 75° off the vertical: the heads land aside, not on Alex while the photo zooms in on him
        const side = i % 2 ? 1 : -1;
        launch({
            x,
            y,
            angle: -Math.PI / 2 + side * random(0.55, 1.3),
            speed: height * random(0.9, 1.6),
            delay: random(0, 0.08),
        });
    }
}

/** A level complete: heads shot from both bottom corners towards the middle, in two waves */
function celebrate() {
    if (prefersReducedMotion()) {
        return;
    }
    const { clientWidth: width, clientHeight: height } = getLayer();
    for (const wave of [0, 0.45]) {
        for (let i = 0; i < 16; i++) {
            // From the vertical, towards the middle: up to 90% of the screen height, the two jets cross
            const tilt = random(0.25, 0.85);
            const speed = height * random(2.6, 3.4);
            const delay = wave + random(0, 0.12);
            const life = random(3, 3.6);
            launch({ x: -10, y: height + 10, angle: -Math.PI / 2 + tilt, speed, delay, life });
            launch({ x: width + 10, y: height + 10, angle: -Math.PI / 2 - tilt, speed, delay, life });
        }
    }
}

export default { burst, celebrate, clear };
