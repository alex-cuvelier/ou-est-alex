<template>
    <!-- A bottom sheet like the photo grid: each gesture shown on a photo rather than described -->
    <Drawer
        v-model:visible="isVisible"
        position="bottom"
        :header="$t('instructions.title')"
        class="oea-instructions-dialog"
        :class="{ 'oea-instructions-dialog--desktop': !isMobile }"
        style="height: auto"
    >
        <p class="oea-instructions-dialog__subtitle">{{ $t('instructions.subtitle') }}</p>

        <ul class="oea-instructions-dialog__demos">
            <li v-for="demo in demos" :key="demo.key" class="oea-instructions-dialog__demo">
                <span class="oea-instructions-dialog__stage" :class="'is-' + demo.kind" aria-hidden="true">
                    <img class="oea-instructions-dialog__photo" :src="demo.photo" alt="" />
                    <img v-if="demo.next" class="oea-instructions-dialog__photo oea-instructions-dialog__photo--next" :src="demo.next" alt="" />

                    <span v-if="demo.kind === 'find'" class="oea-instructions-dialog__ring" :style="demo.spot"></span>

                    <template v-if="demo.kind === 'clue'">
                        <span class="oea-instructions-dialog__clue" :style="demo.spot"></span>
                        <span class="oea-instructions-dialog__tool">
                            <img src="@/assets/icons/compass-solid.svg" alt="" />
                            {{ $t('quest.clue') }}
                        </span>
                    </template>

                    <span v-if="demo.kind === 'keys'" class="oea-instructions-dialog__keys">
                        <kbd class="oea-instructions-dialog__key">←</kbd>
                        <kbd class="oea-instructions-dialog__key oea-instructions-dialog__key--next">→</kbd>
                    </span>

                    <!-- A finger on touch screens, the mouse pointer on desktop (a second finger to pinch) -->
                    <template v-if="demo.pointer">
                        <span class="oea-instructions-dialog__pointer" :style="demo.spot">
                            <svg v-if="!isMobile" viewBox="0 0 24 24"><path d="M5 2.5v16l4.2-3.8 2.9 6.3 2.6-1.2-2.9-6.2 5.7-.4z" /></svg>
                        </span>
                        <span v-if="isMobile && demo.kind === 'zoom'" class="oea-instructions-dialog__pointer oea-instructions-dialog__pointer--second"></span>
                    </template>

                    <!-- Desktop zoom: the mouse, its wheel rolling while the photo zooms -->
                    <span v-if="demo.wheel" class="oea-instructions-dialog__mouse">
                        <svg viewBox="0 0 24 24">
                            <rect x="6" y="2.5" width="12" height="19" rx="6" />
                            <path class="oea-instructions-dialog__wheel" d="M12 6.5v3" />
                        </svg>
                    </span>
                </span>
                <b class="oea-instructions-dialog__label">{{ $t(`instructions.${demo.key}.label`) }}</b>
                <span class="oea-instructions-dialog__description">{{ $t(`instructions.${demo.key}.description`) }}</span>
            </li>
        </ul>

        <p class="oea-instructions-dialog__levels">{{ $t('instructions.tips.levels.description') }}</p>

        <button type="button" class="oea-button oea-instructions-dialog__button" autofocus @click="closeDialog">{{ $t('instructions.gotIt') }}</button>
    </Drawer>
</template>

<script setup>
import { computed } from 'vue';
import useDeviceDetection from '@/composables/useDeviceDetection.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:visible']);

const { isMobile } = useDeviceDetection();

const isVisible = computed({
    get() {
        return props.visible;
    },
    set(value) {
        emit('update:visible', value);
    },
});

// Thumbnails the home cards already show; the ring and the clue circle sit away from Alex, so the help gives nothing away
const thumb = (name) => `/images/thumbs/${name}.webp`;
const CENTER = { left: '50%', top: '50%' };

// The controls of the device in use, each with its photo and where the gesture lands
const demos = computed(() => {
    const zoom = { kind: 'zoom', photo: thumb(2), spot: CENTER, pointer: true };
    const pan = { kind: 'pan', photo: thumb(12), spot: CENTER, pointer: true };
    const find = { kind: 'find', photo: thumb(3), spot: { left: '28%', top: '62%' }, pointer: true };
    const clue = { kind: 'clue', key: 'tips.clue', photo: thumb(1), spot: { left: '72%', top: '40%' } };

    if (isMobile.value) {
        return [{ ...zoom, key: 'mobile.pinch' }, { ...pan, key: 'mobile.pan' }, { ...find, key: 'mobile.tap' }, clue];
    }
    return [
        { ...zoom, key: 'desktop.zoom', pointer: false, wheel: true },
        { ...pan, key: 'desktop.pan' },
        { ...find, key: 'desktop.click' },
        { kind: 'keys', key: 'desktop.keyboard', photo: thumb(47), next: thumb(19) },
        clue,
    ];
});

function closeDialog() {
    isVisible.value = false;
}
</script>

<style lang="scss">
.oea-instructions-dialog.p-drawer {
    max-height: 90svh;
    border: 0;
    border-radius: 1.5rem 1.5rem 0 0;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 -20px 60px -20px rgba(0, 0, 0, 0.5);

    .p-drawer-header {
        padding: 1.25rem 1rem 0;
    }

    .p-drawer-title {
        font-size: 1.125rem;
        font-weight: 700;
        letter-spacing: -0.02em;
    }

    .p-drawer-content {
        padding: 0 1rem calc(1.25rem + var(--safe-bottom));
    }
}

.oea-instructions-dialog__subtitle {
    max-width: 60rem;
    margin: 0 auto 0.875rem;
    font-size: 0.875rem;
    color: var(--mid);
}

.oea-instructions-dialog__demos {
    max-width: 60rem;
    margin: 0 auto;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 0.625rem;
}

.oea-instructions-dialog__demo {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

// The photo stage of the game, at thumbnail size
.oea-instructions-dialog__stage {
    --pan: 16px;

    position: relative;
    display: block;
    aspect-ratio: 4 / 3;
    margin-bottom: 0.375rem;
    border-radius: 14px;
    overflow: hidden;
    isolation: isolate;
    background: var(--stage);
}

.oea-instructions-dialog__photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;

    &--next {
        opacity: 0;
    }
}

.oea-instructions-dialog__label {
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
}

.oea-instructions-dialog__description {
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--mid);
}

// Same look as the game's ring around Alex, the rest of the photo dimmed
.oea-instructions-dialog__ring {
    position: absolute;
    width: 2.125rem;
    height: 2.125rem;
    margin: -1.0625rem 0 0 -1.0625rem;
    border: 3px solid var(--hot);
    border-radius: 50%;
    box-shadow:
        0 0 0 1.5px rgba(255, 255, 255, 0.85),
        0 0 0 100vmax rgba(0, 0, 0, 0.35);
}

// Same look as the game's clue: red ring, white inner line
.oea-instructions-dialog__clue {
    position: absolute;
    width: 4rem;
    height: 4rem;
    margin: -2rem 0 0 -2rem;
    border: 3px solid var(--hot);
    border-radius: 50%;
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.35);

    &::before {
        content: '';
        position: absolute;
        inset: 2px;
        border: 1.5px solid rgba(255, 255, 255, 0.85);
        border-radius: 50%;
    }
}

// The dock's clue button, in miniature
.oea-instructions-dialog__tool {
    position: absolute;
    left: 50%;
    bottom: 0.5rem;
    width: 3.75rem;
    height: 2.375rem;
    margin-left: -1.875rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border-radius: 0.625rem;
    background: var(--glass);
    box-shadow: inset 0 0 0 1px var(--glass-line);
    color: var(--on-glass);
    font-size: 0.625rem;
    line-height: 1;

    img {
        width: 0.95rem;
        height: 0.95rem;
        filter: brightness(0) invert(1);
    }
}

.oea-instructions-dialog__keys {
    position: absolute;
    left: 50%;
    bottom: 0.5rem;
    display: flex;
    gap: 0.25rem;
    transform: translateX(-50%);
}

.oea-instructions-dialog__key {
    min-width: 1.75rem;
    height: 1.75rem;
    display: grid;
    place-items: center;
    border-radius: 0.5rem;
    background: var(--glass);
    box-shadow:
        inset 0 0 0 1px var(--glass-line),
        0 2px 0 rgba(0, 0, 0, 0.4);
    color: var(--on-glass);
    font-family: var(--font-mono);
    font-size: 0.75rem;
}

// A fingertip; on desktop only its arrow shows, the tip on the spot
.oea-instructions-dialog__pointer {
    position: absolute;
    width: 1.375rem;
    height: 1.375rem;
    margin: -0.6875rem 0 0 -0.6875rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    box-shadow:
        0 0 0 2px #fff,
        0 4px 10px rgba(0, 0, 0, 0.35);

    &--second {
        left: 50%;
        top: 50%;
    }

    .oea-instructions-dialog--desktop & {
        margin: 0;
        background: none;
        box-shadow: none;
    }

    svg {
        display: block;
        width: 1.25rem;
        height: 1.25rem;
        fill: #fff;
        stroke: #0f0f12;
        stroke-width: 1.4;
        stroke-linejoin: round;
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
    }
}

// Glass like the keys, white line like the pointer
.oea-instructions-dialog__mouse {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    svg {
        display: block;
        width: 2.75rem;
        height: 2.75rem;
        fill: var(--glass);
        stroke: #fff;
        stroke-width: 1.6;
        stroke-linecap: round;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }
}

.oea-instructions-dialog__wheel {
    stroke-width: 2.2;
}

.oea-instructions-dialog__levels {
    max-width: 60rem;
    margin: 1rem auto 0;
    font-size: 0.8125rem;
    text-align: center;
    color: var(--mid);
}

.oea-instructions-dialog__button {
    display: flex;
    width: 100%;
    max-width: 22rem;
    margin: 0.875rem auto 0;
}

// Desktop: five controls on one row, a size up, the title lined up with the photos
.oea-instructions-dialog--desktop {
    --sheet-width: 80rem;

    &.p-drawer {
        .p-drawer-header {
            padding: 2rem max(2rem, calc((100% - var(--sheet-width)) / 2)) 0;
        }

        .p-drawer-title {
            font-size: 1.5rem;
        }

        .p-drawer-content {
            padding: 0 2rem calc(2rem + var(--safe-bottom));
        }
    }

    .oea-instructions-dialog__subtitle,
    .oea-instructions-dialog__demos,
    .oea-instructions-dialog__levels {
        max-width: var(--sheet-width);
    }

    .oea-instructions-dialog__subtitle {
        margin-bottom: 1.25rem;
        font-size: 1rem;
    }

    .oea-instructions-dialog__demos {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 1.5rem;
    }

    .oea-instructions-dialog__stage {
        --pan: 1.5rem;

        margin-bottom: 0.625rem;
        border-radius: var(--radius-card);
    }

    .oea-instructions-dialog__label {
        font-size: 1rem;
    }

    .oea-instructions-dialog__description {
        font-size: 0.9375rem;
    }

    .oea-instructions-dialog__ring {
        width: 2.75rem;
        height: 2.75rem;
        margin: -1.375rem 0 0 -1.375rem;
    }

    .oea-instructions-dialog__clue {
        width: 5.5rem;
        height: 5.5rem;
        margin: -2.75rem 0 0 -2.75rem;
    }

    .oea-instructions-dialog__tool {
        bottom: 0.75rem;
        width: 4.5rem;
        height: 2.875rem;
        margin-left: -2.25rem;
        font-size: 0.75rem;

        img {
            width: 1.15rem;
            height: 1.15rem;
        }
    }

    .oea-instructions-dialog__keys {
        bottom: 0.75rem;
        gap: 0.375rem;
    }

    .oea-instructions-dialog__key {
        min-width: 2.25rem;
        height: 2.25rem;
        font-size: 0.9375rem;
    }

    .oea-instructions-dialog__pointer svg {
        width: 1.625rem;
        height: 1.625rem;
    }

    .oea-instructions-dialog__levels {
        margin-top: 1.5rem;
        font-size: 0.9375rem;
    }

    .oea-instructions-dialog__button {
        max-width: 24rem;
        min-height: 3rem;
        margin-top: 1.25rem;
        font-size: 1rem;
    }
}

// --- The gestures, looped. With reduced motion (base.scss) each stage shows its still state ---

.oea-instructions-dialog__stage {
    --loop: 3.2s;

    &.is-zoom .oea-instructions-dialog__photo {
        animation: helpZoom var(--loop) ease-in-out infinite;
    }

    &.is-zoom .oea-instructions-dialog__wheel {
        animation: helpWheel var(--loop) ease-in-out infinite;
    }

    &.is-pan .oea-instructions-dialog__photo {
        animation: helpPanPhoto var(--loop) ease-in-out infinite;
    }

    &.is-pan .oea-instructions-dialog__pointer {
        animation: helpPanPointer var(--loop) ease-in-out infinite;
    }

    &.is-find .oea-instructions-dialog__pointer {
        animation: helpTap var(--loop) ease-out infinite;
    }

    &.is-find .oea-instructions-dialog__ring {
        animation: helpRing var(--loop) var(--ease-out) infinite;
    }

    &.is-clue .oea-instructions-dialog__tool {
        animation: helpPress var(--loop) ease-out infinite;
    }

    &.is-clue .oea-instructions-dialog__clue {
        animation: helpClue var(--loop) ease-out infinite;
    }

    &.is-keys .oea-instructions-dialog__photo--next {
        animation: helpNextPhoto var(--loop) ease-in-out infinite;
    }

    &.is-keys .oea-instructions-dialog__key--next {
        animation: helpPress var(--loop) ease-out infinite;
    }
}

// Two fingers on touch screens: they spread while the photo zooms
.oea-instructions-dialog:not(.oea-instructions-dialog--desktop) .is-zoom .oea-instructions-dialog__pointer {
    animation: helpPinchA var(--loop) ease-in-out infinite;

    &--second {
        animation-name: helpPinchB;
    }
}

@keyframes helpZoom {
    0%,
    15%,
    100% {
        transform: scale(1);
    }
    50%,
    65% {
        transform: scale(1.35);
    }
}

// Two notches up while the photo zooms in, two down while it zooms out
@keyframes helpWheel {
    0%,
    15%,
    32%,
    50%,
    65%,
    82%,
    100% {
        transform: translateY(0);
    }
    24%,
    41% {
        transform: translateY(-2px);
    }
    74%,
    91% {
        transform: translateY(2px);
    }
}

@keyframes helpPinchA {
    0%,
    15%,
    100% {
        transform: translate(0, 0);
    }
    50%,
    65% {
        transform: translate(-22px, -14px);
    }
}

@keyframes helpPinchB {
    0%,
    15%,
    100% {
        transform: translate(0, 0);
    }
    50%,
    65% {
        transform: translate(22px, 14px);
    }
}

@keyframes helpPanPhoto {
    0%,
    12%,
    100% {
        transform: translateX(var(--pan)) scale(1.4);
    }
    50%,
    62% {
        transform: translateX(calc(-1 * var(--pan))) scale(1.4);
    }
}

@keyframes helpPanPointer {
    0%,
    12%,
    100% {
        transform: translateX(var(--pan));
    }
    50%,
    62% {
        transform: translateX(calc(-1 * var(--pan)));
    }
}

@keyframes helpTap {
    0%,
    10% {
        opacity: 0;
        transform: scale(1.4);
    }
    22% {
        opacity: 1;
        transform: scale(1);
    }
    34%,
    100% {
        opacity: 0;
    }
}

@keyframes helpRing {
    0%,
    28% {
        opacity: 0;
        transform: scale(1.3);
    }
    40%,
    85% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
    }
}

@keyframes helpPress {
    0%,
    40%,
    50%,
    100% {
        transform: scale(1);
    }
    45% {
        transform: scale(0.88);
    }
}

@keyframes helpClue {
    0%,
    48% {
        opacity: 0;
        transform: scale(1.08);
    }
    55%,
    85% {
        opacity: 1;
        transform: scale(1);
    }
    95%,
    100% {
        opacity: 0;
    }
}

@keyframes helpNextPhoto {
    0%,
    45% {
        opacity: 0;
    }
    55%,
    90% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
</style>
