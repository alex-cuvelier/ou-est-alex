<template>
    <div class="oea-stage" :class="{ 'oea-stage--end': !isQuest }">
        <template v-if="isQuest">
            <!-- Blurred thumbnail behind the photo: no black bars, and a placeholder while the photo loads -->
            <div class="oea-backdrop" :style="{ backgroundImage: `url(${thumbUrl(currentQuest)})` }" aria-hidden="true"></div>

            <main ref="photoArea" class="oea-photo-area">
                <div
                    ref="imageWrapper"
                    class="oea-image-wrapper"
                    :class="{
                        'oea-display-clue': displayClue,
                        'oea-dragging': isDragging,
                        'oea-snapping': isSnapping,
                        'oea-zooming': isZooming,
                        'oea-shaking': isShaking,
                    }"
                    :style="{ ...wrapperStyle, ...transformStyle }"
                    @mousedown.left="onMouseDown"
                    @mousemove="onMouseMove"
                    @wheel="onWheel"
                    @touchstart="onTouchStart"
                    @touchmove="onTouchMove"
                    @touchend="onTouchEnd"
                >
                    <img class="oea-img" :src="currentQuest.url" :alt="$t('quest.photoAlt')" draggable="false" />
                    <span v-for="miss in misses" :key="miss.id" class="oea-miss" :style="{ left: miss.x + '%', top: miss.y + '%' }" aria-hidden="true"></span>
                </div>
            </main>

            <div class="oea-top">
                <RouterLink class="oea-pill" :to="{ name: 'levelChooser' }" :title="$t('quest.back')">
                    <svg class="oea-pill-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                    {{ $t('quest.position', { level: $t('difficulty.' + currentDifficultyLevel), index: currentQuestIndex + 1, count: photoCount }) }}
                </RouterLink>
                <div class="oea-top-right">
                    <span class="oea-pill oea-mono" role="timer" :aria-label="$t('quest.timer')">{{ formatClock(timer) }}</span>
                    <button type="button" class="oea-pill oea-pill--round" :aria-label="$t('header.showInstructions')" @click="instructionsVisible = true">
                        ?
                    </button>
                </div>
            </div>

            <nav class="oea-dock" :aria-label="$t('quest.controls')">
                <button
                    type="button"
                    class="oea-dock-btn"
                    :disabled="currentQuestIndex === 0"
                    :aria-label="$t('quest.previous')"
                    @click="questsStore.goToPreviousQuest"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button
                    type="button"
                    class="oea-compass"
                    :class="{ 'is-nudging': suggestClue }"
                    :disabled="displayClue"
                    :title="$t('header.ask-clue')"
                    :aria-label="$t('quest.askClue', { clues: $t('quest.clues', questStats.clueCount) })"
                    @click="showClue"
                >
                    <img src="@/assets/icons/compass-solid.svg" alt="" />
                    <span v-if="questStats.clueCount" class="oea-compass-count oea-mono" aria-hidden="true">{{ questStats.clueCount }}</span>
                </button>
                <button type="button" class="oea-dock-grid" @click="gridVisible = true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
                        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
                        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
                    </svg>
                    {{ $t('quest.photos') }}
                </button>
                <button type="button" class="oea-dock-btn" :aria-label="$t('quest.next')" @click="questsStore.goToNextQuest">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
            </nav>

            <OeaQuestGrid v-model:visible="gridVisible" />
        </template>
        <OeaEndStats v-else />
    </div>
</template>

<script setup>
import OeaEndStats from '@/components/OeaEndStats.vue';
import OeaQuestGrid from '@/components/OeaQuestGrid.vue';

import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useQuestsStore } from '@/stores/questsStore.js';
import { useUiStore } from '@/stores/uiStore.js';
import { pointInPolygon, toPolygon, getPolygonCenter, getRandomPointInCircle, alexPosition, formatClock, thumbUrl } from '@/utils/utils.js';
import confetti from '@/composables/useConfetti';
import useImageZoom from '@/composables/useImageZoom.js';

import { playOk, playKo, playNoob } from '@/composables/useSounds.js';

const CLUE_SHRINK = 0.8;
const CLUE_MIN_SIZE = 50;
const CLUE_NUDGE_DELAY = 90; // seconds searching without a clue before the compass pulses
const MISS_LIFETIME = 2500;

const route = useRoute();
const router = useRouter();

const questsStore = useQuestsStore();
const { currentDifficultyLevel, currentQuest, nextQuest, currentQuestIndex, photoCount } = storeToRefs(questsStore);
const { instructionsVisible } = storeToRefs(useUiStore());

const isQuest = computed(() => currentQuest.value?.type === 'quest');

// --- Route → store (direct link, refresh, browser back) ---

function parseLevel(param) {
    if (param === 'all') {
        return 'all';
    }
    const level = parseInt(param);
    return Number.isNaN(level) ? 0 : level;
}

function applyRoute(params) {
    const level = parseLevel(params?.difficultyLevel);
    if (level !== currentDifficultyLevel.value) {
        questsStore.startLevel(level);
    }
    questsStore.setCurrentQuestIndex((parseInt(params?.imageIndex) || 1) - 1);
}

applyRoute(route.params);

// --- Current attempt on the displayed photo ---

const questStats = ref({ questId: null, clueCount: 0, noCount: 0, found: false });
const timer = ref(0);
const isFound = ref(false);
const gridVisible = ref(false);
const pageVisible = ref(!document.hidden);

// The timer only counts while the player is actually searching
const timerRunning = computed(() => isQuest.value && !isFound.value && !instructionsVisible.value && !gridVisible.value && pageVisible.value);

let timerInterval = null;

// Restarted on each photo so that the first second really is one second on it
function restartTimer() {
    clearInterval(timerInterval);
    timer.value = 0;
    timerInterval = setInterval(() => {
        if (timerRunning.value) {
            timer.value++;
        }
    }, 1000);
}

function onVisibilityChange() {
    pageVisible.value = !document.hidden;
}

function resetQuestStats() {
    questStats.value = { questId: currentQuest.value?.id ?? null, clueCount: 0, noCount: 0, found: false };
    restartTimer();
    isFound.value = false;
    misses.value = [];
    clueFactor.value = 1;
}

// Leaving a photo saves what happened on it (skipped if the player only passed through)
function recordCurrentAttempt() {
    const { questId, clueCount, noCount, found } = questStats.value;
    if (!found && timer.value === 0 && clueCount === 0 && noCount === 0) {
        return;
    }
    questsStore.recordAttempt(questId, { time: timer.value, clueCount, noCount, found });
}

// --- Layout: fit the photo in the area between the top pills and the dock ---

const photoArea = ref(null);
const imageWrapper = ref(null);
const wrapperSize = ref({ width: 0, height: 0 });
const clueBase = ref(0);

function updateLayout() {
    const area = photoArea.value;
    if (!area || !isQuest.value) {
        return;
    }

    const style = getComputedStyle(area);
    const availableWidth = area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const availableHeight = area.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const ratio = currentQuest.value.width / currentQuest.value.height;

    let width = availableWidth;
    let height = availableWidth / ratio;
    if (height > availableHeight) {
        height = availableHeight;
        width = availableHeight * ratio;
    }

    wrapperSize.value = { width, height };
    clueBase.value = Math.min(availableWidth, availableHeight);
}

const resizeObserver = new ResizeObserver(() => updateLayout());

watch(photoArea, (element, previous) => {
    if (previous) {
        resizeObserver.unobserve(previous);
    }
    if (element) {
        resizeObserver.observe(element);
    }
});

// --- Clue: a circle around Alex, smaller at each use ---

const displayClue = ref(false);
const clueFactor = ref(1);
const clueCenter = ref({ x: 0.5, y: 0.5 }); // fraction of the photo
const clueSize = computed(() => Math.max(CLUE_MIN_SIZE, clueBase.value * clueFactor.value));
const suggestClue = computed(() => timer.value >= CLUE_NUDGE_DELAY && questStats.value.clueCount === 0 && !isFound.value);

const {
    scale,
    isDragging,
    isSnapping,
    isZooming,
    transformStyle,
    resetTransform,
    animateZoomTo,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
} = useImageZoom(checkAlexFound, imageWrapper);

const wrapperStyle = computed(() => {
    const { width, height } = wrapperSize.value;
    return {
        width: width + 'px',
        height: height + 'px',
        '--clue-size': clueSize.value + 'px',
        '--clue-x': clueCenter.value.x * width - clueSize.value / 2 + 'px',
        '--clue-y': clueCenter.value.y * height - clueSize.value / 2 + 'px',
        '--zoom': scale.value,
    };
});

function randomizeClueCenter() {
    const { width, height } = wrapperSize.value;
    if (!width || !height) {
        return;
    }
    const alex = alexPosition(currentQuest.value);
    const point = getRandomPointInCircle((alex.x / 100) * width, (alex.y / 100) * height, Math.max(0, clueSize.value / 2 - 20));
    clueCenter.value = { x: point.x / width, y: point.y / height };
}

function showClue() {
    playNoob();
    questStats.value.clueCount++;
    randomizeClueCenter();
    displayClue.value = true;
    setTimeout(() => {
        displayClue.value = false;
        if (clueSize.value > CLUE_MIN_SIZE) {
            clueFactor.value *= CLUE_SHRINK;
        }
    }, 100);
}

// --- Clicks on the photo ---

const isShaking = ref(false);
const misses = ref([]);
let missId = 0;

function addMiss(event) {
    const image = event.target;
    const id = ++missId;
    misses.value = [...misses.value.slice(-4), { id, x: (event.offsetX / image.width) * 100, y: (event.offsetY / image.height) * 100 }];
    setTimeout(() => {
        misses.value = misses.value.filter((miss) => miss.id !== id);
    }, MISS_LIFETIME);
}

function checkAlexFound(event) {
    if (isFound.value) {
        return;
    }

    const xRatio = event.target.naturalWidth / event.target.width;
    const yRatio = event.target.naturalHeight / event.target.height;
    const polygon = toPolygon(currentQuest.value.coords, xRatio, yRatio);

    if (pointInPolygon(polygon, event.offsetX, event.offsetY)) {
        onAlexFound(polygon);
    } else {
        playKo();
        questStats.value.noCount++;
        addMiss(event);
        isShaking.value = true;
        setTimeout(() => {
            isShaking.value = false;
        }, 400);
    }
}

async function onAlexFound(polygon) {
    const foundQuest = currentQuest.value;
    isFound.value = true;
    questStats.value.found = true;
    misses.value = [];
    playOk();
    confetti.start();

    const center = getPolygonCenter(polygon);
    await animateZoomTo(center.x, center.y, 15, 1600);
    confetti.stop();

    // The player may already have moved on during the animation
    if (currentQuest.value === foundQuest) {
        questsStore.goToNextQuest();
    }
}

function preloadNextImage() {
    if (nextQuest.value?.type !== 'quest') {
        return;
    }

    const nextImage = new Image();
    nextImage.src = nextQuest.value.url;
}

// --- Quest changes (navigation, found, level change) ---

watch(currentQuest, async () => {
    recordCurrentAttempt();
    gridVisible.value = false;

    router.push({
        name: 'quest',
        params: {
            difficultyLevel: currentDifficultyLevel.value,
            imageIndex: currentQuestIndex.value + 1,
        },
    });

    resetTransform();
    resetQuestStats();

    if (isQuest.value) {
        questsStore.rememberPosition();
        await nextTick();
        updateLayout();
    } else {
        questsStore.clearPosition();
    }
});

watch(
    () => route.params,
    (params) => {
        if (route.name === 'quest') {
            applyRoute(params);
        }
    },
);

watch(currentQuest, preloadNextImage, { immediate: true });

onMounted(() => {
    resetQuestStats();
    if (isQuest.value) {
        questsStore.rememberPosition();
    }

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted(() => {
    recordCurrentAttempt();
    clearInterval(timerInterval);
    resizeObserver.disconnect();
    confetti.stop();
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style lang="scss">
.oea-stage {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: var(--stage);
    color: var(--on-glass);

    &--end {
        overflow-y: auto;
        background: var(--paper);
        color: var(--ink);
    }
}

.oea-backdrop {
    position: absolute;
    inset: -48px;
    background-size: cover;
    background-position: center;
    filter: blur(32px) saturate(1.2) brightness(0.5);
    pointer-events: none;
}

// The photo is fitted between the top pills and the dock, but can be zoomed beneath them
.oea-photo-area {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(4.25rem + var(--safe-top)) 0.75rem calc(5.5rem + var(--safe-bottom));
    overflow: hidden;

    @media (min-width: 900px) {
        padding-inline: 1.5rem;
    }
}

.oea-image-wrapper {
    position: relative;
    flex: 0 0 auto;
    overflow: hidden;
    touch-action: none;
    border-radius: 6px;
    box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.7);

    .oea-img {
        display: block;
        width: 100%;
        height: 100%;
        cursor: crosshair;
        user-select: none;
        -webkit-user-drag: none;
    }

    &.oea-dragging .oea-img {
        cursor: grabbing;
    }

    &.oea-snapping {
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    }

    &.oea-zooming {
        transition: transform 1.6s cubic-bezier(0.25, 1, 0.5, 1);
    }

    // Clue: red ring, white inner line, and the rest of the photo dimmed
    &::after,
    &::before {
        content: '';
        display: none;
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
    }

    &.oea-display-clue::after,
    &.oea-display-clue::before {
        display: block;
    }

    &::after {
        top: var(--clue-y);
        left: var(--clue-x);
        width: var(--clue-size);
        height: var(--clue-size);
        border: 3px solid var(--hot);
        box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.35);
    }

    &::before {
        z-index: 1;
        top: calc(var(--clue-y) + 5px);
        left: calc(var(--clue-x) + 5px);
        width: calc(var(--clue-size) - 10px);
        height: calc(var(--clue-size) - 10px);
        border: 1.5px solid rgba(255, 255, 255, 0.85);
    }
}

// Wrong click marker: a cross that fades away, same size whatever the zoom
.oea-miss {
    position: absolute;
    width: 18px;
    height: 18px;
    pointer-events: none;
    transform: translate(-50%, -50%) scale(calc(1 / var(--zoom, 1)));
    animation: missFade 2.5s ease-out;

    &::before,
    &::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        width: 2.5px;
        height: 100%;
        margin-left: -1.25px;
        border-radius: 2px;
        background: #fff;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
    }

    &::before {
        transform: rotate(45deg);
    }

    &::after {
        transform: rotate(-45deg);
    }
}

@keyframes missFade {
    0% {
        opacity: 0;
    }
    8%,
    70% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}

// Shake animation on wrong answer (applied to img to avoid conflicting with wrapper transform)
.oea-image-wrapper.oea-shaking .oea-img {
    animation: imgShake var(--transition-shake);
}

@keyframes imgShake {
    0%,
    100% {
        transform: translateX(0);
    }
    20% {
        transform: translateX(-8px);
    }
    40% {
        transform: translateX(8px);
    }
    60% {
        transform: translateX(-5px);
    }
    80% {
        transform: translateX(5px);
    }
}

// --- Top pills ---

.oea-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: calc(0.875rem + var(--safe-top)) max(0.75rem, env(safe-area-inset-right, 0px)) 0 max(0.75rem, env(safe-area-inset-left, 0px));
    pointer-events: none;

    > * {
        pointer-events: auto;
    }
}

.oea-top-right {
    display: flex;
    gap: 0.4rem;
}

.oea-pill-icon {
    width: 0.9rem;
    height: 0.9rem;
    margin-left: -0.25rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.oea-pill--round {
    width: 2.25rem;
    padding: 0;
    justify-content: center;
    font-weight: 600;
}

// --- Dock ---

.oea-dock {
    position: absolute;
    left: 50%;
    bottom: calc(0.875rem + var(--safe-bottom));
    z-index: 2;
    transform: translateX(-50%);
    width: min(calc(100% - 1.5rem), 20rem);
    height: 3.75rem;
    padding: 0 0.625rem;
    display: grid;
    grid-template-columns: 2.5rem 1fr 1fr 2.5rem;
    align-items: center;
    justify-items: center;
    gap: 0.25rem;
    border-radius: 1.5rem;
    background: var(--glass);
    color: var(--on-glass);
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    box-shadow:
        inset 0 0 0 1px var(--glass-line),
        0 12px 32px -12px rgba(0, 0, 0, 0.55);

    svg {
        width: 1.15rem;
        height: 1.15rem;
    }

    path {
        fill: none;
        stroke: currentColor;
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    rect {
        fill: currentColor;
    }
}

.oea-dock-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    cursor: pointer;
    transition:
        background-color 150ms ease,
        transform 150ms var(--ease-out);

    &:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.22);
    }

    &:not(:disabled):active {
        transform: scale(0.92);
    }

    &:disabled {
        opacity: 0.3;
        cursor: default;
    }
}

// Clue: available but not inviting (it costs, and the "noob" sound says so). Red stays for Alex.
.oea-compass {
    position: relative;
    width: 2.75rem;
    height: 2.75rem;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    cursor: pointer;
    transition:
        background-color 150ms ease,
        transform 150ms var(--ease-out);

    img {
        width: 1.4rem;
        height: 1.4rem;
        filter: brightness(0) invert(1);
    }

    &:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.22);
    }

    &:not(:disabled):active {
        transform: scale(0.92);
    }

    &:disabled {
        cursor: default;
    }

    // Stuck for a while without any clue: a slow, discreet halo
    &.is-nudging {
        animation: compassNudge 2.4s ease-in-out infinite;

        // Without motion, the halo stays on instead of pulsing
        @media (prefers-reduced-motion: reduce) {
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.22);
        }
    }
}

.oea-compass-count {
    position: absolute;
    top: -0.2rem;
    right: -0.3rem;
    min-width: 1.1rem;
    height: 1.1rem;
    padding: 0 0.25rem;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--on-glass);
    color: var(--stage);
    font-size: 0.625rem;
    font-weight: 500;
    line-height: 1;
}

@keyframes compassNudge {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
    50% {
        box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.22);
    }
}

.oea-dock-grid {
    justify-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0.25rem 0.5rem;
    border: 0;
    border-radius: 0.75rem;
    background: none;
    font-size: 0.6875rem;
    cursor: pointer;
    transition: background-color 150ms ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
}
</style>
