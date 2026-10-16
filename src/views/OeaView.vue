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
                    <img ref="photo" class="oea-img" :src="currentQuest.url" :alt="$t('quest.photoAlt')" draggable="false" @load="onImageLoad" />
                    <span v-for="miss in misses" :key="miss.id" class="oea-miss" :style="{ left: miss.x + '%', top: miss.y + '%' }" aria-hidden="true"></span>
                    <span
                        v-if="isFound && ring"
                        class="oea-alex-ring"
                        :style="{ left: ring.x + '%', top: ring.y + '%', width: ring.width + '%', height: ring.height + '%' }"
                        aria-hidden="true"
                    ></span>
                </div>
            </main>

            <div class="oea-top">
                <div class="oea-top-group">
                    <RouterLink v-tooltip.bottom="tooltip($t('quest.back'))" class="oea-pill" :to="{ name: 'levelChooser' }">
                        <svg class="oea-pill-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                        {{ $t('quest.position', { level: $t('difficulty.' + currentDifficultyLevel), index: currentQuestIndex + 1, count: photoCount }) }}
                    </RouterLink>
                    <button
                        v-tooltip.bottom="tooltip($t('home.howTo'))"
                        type="button"
                        class="oea-pill oea-pill--round"
                        :aria-label="$t('header.showInstructions')"
                        @click="instructionsVisible = true"
                    >
                        ?
                    </button>
                </div>
                <!-- Right edge of the screen: tooltip on the left, a centered one would be squeezed against the edge -->
                <span v-tooltip.left="tooltip($t('quest.timerHint'))" class="oea-pill oea-mono" role="timer" :aria-label="$t('quest.timer')">
                    {{ formatClock(clock) }}
                </span>
            </div>

            <!-- Alex found, just now or earlier in the run: the time on this photo and the way on -->
            <Transition name="oea-found">
                <div v-if="isFound" class="oea-found" role="status">
                    <div class="oea-found-text">
                        <b>{{ $t(justFound ? 'quest.foundIn' : 'quest.alreadyFound', { time: formatClock(runStat.time) }) }}</b>
                        <span class="oea-found-details oea-mono">
                            <span v-for="detail in foundDetails" :key="detail">{{ detail }}</span>
                        </span>
                    </div>
                    <button
                        type="button"
                        class="oea-found-next"
                        :class="{ 'is-counting': justFound }"
                        :style="{ '--advance-delay': ADVANCE_DELAY + 'ms' }"
                        @click="advance"
                    >
                        {{ upcomingQuest ? $t('quest.continue') : $t('quest.recap') }}
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                </div>
            </Transition>

            <nav class="oea-dock" :aria-label="$t('quest.controls')">
                <button
                    v-tooltip.top="tooltip($t('quest.previous') + ' (←)')"
                    type="button"
                    class="oea-dock-btn"
                    :disabled="currentQuestIndex === 0"
                    :aria-label="$t('quest.previous')"
                    @click="questsStore.goToPreviousQuest"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <!-- The two tools share one look (icon + label), framed by the round arrows -->
                <button
                    v-tooltip.top="tooltip($t('header.ask-clue'))"
                    type="button"
                    class="oea-dock-tool"
                    :class="{ 'is-nudging': suggestClue, 'is-off': isFound }"
                    :disabled="displayClue || isFound"
                    :aria-label="$t('quest.askClue', { clues: $t('quest.clues', totalClues) })"
                    @click="showClue"
                >
                    <span class="oea-dock-icon">
                        <img src="@/assets/icons/compass-solid.svg" alt="" />
                        <span v-if="totalClues" class="oea-compass-count oea-mono" aria-hidden="true">{{ totalClues }}</span>
                    </span>
                    {{ $t('quest.clue') }}
                </button>
                <button v-tooltip.top="tooltip($t('grid.title'))" type="button" class="oea-dock-tool" @click="gridVisible = true">
                    <span class="oea-dock-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
                            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
                            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
                        </svg>
                    </span>
                    {{ $t('quest.photos') }}
                </button>
                <button
                    v-tooltip.top="tooltip(nextLabel + ' (→)')"
                    type="button"
                    class="oea-dock-btn"
                    :aria-label="nextLabel"
                    @click="questsStore.goToNextQuest"
                >
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
import { useI18n } from 'vue-i18n';

import { useQuestsStore } from '@/stores/questsStore.js';
import { useUiStore } from '@/stores/uiStore.js';
import { pointInPolygon, toPolygon, getPolygonCenter, getRandomPointInCircle, alexPosition, alexRing, formatClock, thumbUrl } from '@/utils/utils.js';
import { tooltip } from '@/utils/tooltip.js';
import confetti from '@/composables/useConfetti';
import useImageZoom from '@/composables/useImageZoom.js';

import { playOk, playKo, playNoob } from '@/composables/useSounds.js';

const CLUE_SHRINK = 0.8;
const CLUE_MIN_SIZE = 50;
const CLUE_DURATION = 200; // ms on screen: a glimpse, with a quick fade in and out
const CLUE_NUDGE_DELAY = 90; // seconds searching without a clue before the compass pulses
const MISS_LIFETIME = 2500;
const FOUND_ZOOM_DURATION = 1600;
const ADVANCE_DELAY = 2800; // ms from the find to the next photo: the zoom on Alex, then time to read the card
const CLOCK_REFRESH = 250; // ms between two refreshes of the displayed time

const route = useRoute();
const router = useRouter();

const questsStore = useQuestsStore();
const { currentDifficultyLevel, currentQuest, upcomingQuest, currentQuestIndex, photoCount, runStats } = storeToRefs(questsStore);
const { instructionsVisible } = storeToRefs(useUiStore());

const isQuest = computed(() => currentQuest.value?.type === 'quest');

const { t } = useI18n();
// On the last photo, "next" leads to the end-of-level recap
const nextLabel = computed(() => (currentQuestIndex.value === photoCount.value - 1 ? t('quest.finish') : t('quest.next')));

// --- Route → store (direct link, refresh, browser back) ---

function parseLevel(param) {
    if (param === 'all') {
        return 'all';
    }
    const level = parseInt(param);
    return Number.isNaN(level) ? 0 : level;
}

// A level switch opens it where its run is, then the photo of the URL is shown if it exists
function applyRoute(params) {
    const level = parseLevel(params?.difficultyLevel);
    if (level !== currentDifficultyLevel.value) {
        questsStore.openLevel(level);
    }
    questsStore.setCurrentQuestIndex((parseInt(params?.imageIndex) || 1) - 1);
}

applyRoute(route.params);

// --- Current visit on the displayed photo ---
// The run keeps what the earlier visits did; the visit holds what happened since it began,
// until it is committed to the run (Alex found, photo left, page hidden).

const visit = ref({ level: null, questId: null, clueCount: 0, noCount: 0 });
const justFound = ref(false); // found during this visit, not in an earlier one
const previousBest = ref(null); // best time before this find, to tell a new record
const imageLoaded = ref(false);
const gridVisible = ref(false);
const pageVisible = ref(!document.hidden);

const runStat = computed(() => runStats.value[currentQuest.value?.id] ?? null);
const isFound = computed(() => Boolean(runStat.value?.found));
const totalClues = computed(() => (runStat.value?.clueCount ?? 0) + visit.value.clueCount);

// --- Timer: measured with timestamps, the interval only refreshes the display ---

// Counts only while the player is actually searching: the photo on screen, nothing over it
const timerRunning = computed(
    () => isQuest.value && imageLoaded.value && !isFound.value && !instructionsVisible.value && !gridVisible.value && pageVisible.value,
);

let visitMs = 0; // searching time of the visit, up to runningSince
let runningSince = null;
const visitSeconds = ref(0);

function elapsedMs() {
    return visitMs + (runningSince === null ? 0 : performance.now() - runningSince);
}

function refreshClock() {
    visitSeconds.value = elapsedMs() / 1000;
}

// Sync: the measure starts and stops at the very moment, not at the next render
watch(
    timerRunning,
    (running) => {
        if (running) {
            runningSince = performance.now();
        } else if (runningSince !== null) {
            visitMs += performance.now() - runningSince;
            runningSince = null;
        }
    },
    { flush: 'sync' },
);

// Time on this photo in the whole run, the current visit included
const clock = computed(() => (runStat.value?.time ?? 0) + visitSeconds.value);

const clockInterval = setInterval(refreshClock, CLOCK_REFRESH);

const photo = ref(null);

function onImageLoad() {
    imageLoaded.value = true;
}

// A photo from the cache can be complete before its load event: no need to wait for it
function checkImageLoaded() {
    if (photo.value?.complete && photo.value.naturalWidth > 0) {
        imageLoaded.value = true;
    }
}

function onVisibilityChange() {
    pageVisible.value = !document.hidden;
    // The tab may never come back (closed, app killed on mobile): save the visit now
    if (document.hidden) {
        commitVisit();
    }
}

// Moves the visit into the run (time, clues, misses), then goes on measuring from zero
function commitVisit(found = false) {
    const { level, questId, clueCount, noCount } = visit.value;
    const time = Math.round(elapsedMs() / 100) / 10;
    visitMs = 0;
    if (runningSince !== null) {
        runningSince = performance.now();
    }
    visit.value = { ...visit.value, clueCount: 0, noCount: 0 };

    // Not even a tenth of a second and nothing done: nothing to record
    if (found || time > 0 || clueCount > 0 || noCount > 0) {
        questsStore.recordAttempt(questId, { time, clueCount, noCount, found }, level);
    }
    refreshClock();
}

function startVisit() {
    // Stops the timer until the new photo is on screen
    imageLoaded.value = false;
    visitMs = 0;
    runningSince = null;
    visit.value = { level: currentDifficultyLevel.value, questId: currentQuest.value?.id ?? null, clueCount: 0, noCount: 0 };
    justFound.value = false;
    clearTimeout(advanceTimeout);
    misses.value = [];
    hideClue();
    // The circle goes on shrinking from where the earlier visits left it
    clueFactor.value = CLUE_SHRINK ** (runStat.value?.clueCount ?? 0);
    refreshClock();
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
const suggestClue = computed(() => clock.value >= CLUE_NUDGE_DELAY && totalClues.value === 0 && !isFound.value);

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
        '--clue-duration': CLUE_DURATION + 'ms',
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

let clueTimeout = null;

function showClue() {
    playNoob();
    visit.value.clueCount++;
    randomizeClueCenter();
    displayClue.value = true;
    clueTimeout = setTimeout(() => {
        displayClue.value = false;
        if (clueSize.value > CLUE_MIN_SIZE) {
            clueFactor.value *= CLUE_SHRINK;
        }
    }, CLUE_DURATION);
}

// Photo changed or Alex found while the circle is on screen
function hideClue() {
    clearTimeout(clueTimeout);
    displayClue.value = false;
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
        visit.value.noCount++;
        addMiss(event);
        isShaking.value = true;
        setTimeout(() => {
            isShaking.value = false;
        }, 400);
    }
}

let advanceTimeout = null;

async function onAlexFound(polygon) {
    previousBest.value = questsStore.bestTime(currentQuest.value.id);
    // Saved at once: the find is kept even if the tab is closed during the animation
    commitVisit(true);
    justFound.value = true;
    misses.value = [];
    hideClue();
    playOk();
    confetti.start();
    advanceTimeout = setTimeout(autoAdvance, ADVANCE_DELAY);

    const center = getPolygonCenter(polygon);
    await animateZoomTo(center.x, center.y, 15, FOUND_ZOOM_DURATION);
    confetti.stop();
}

// --- Once found: the card, then the next photo still to search ---

const ring = computed(() => alexRing(currentQuest.value));

// Compared as displayed (whole seconds), so that a record never reads "0:12, before 0:12"
const shownSeconds = (seconds) => Math.floor(seconds);

const foundDetails = computed(() => {
    const stat = runStat.value;
    if (!stat?.found) {
        return [];
    }

    const parts = [stat.clueCount ? t('quest.clues', stat.clueCount) : t('quest.noClue')];
    if (stat.noCount) {
        parts.push(t('quest.nos', stat.noCount));
    }

    const best = justFound.value ? previousBest.value : questsStore.bestTime(currentQuest.value.id);
    if (justFound.value && best != null && shownSeconds(stat.time) < shownSeconds(best)) {
        parts.push(t('quest.newRecord', { time: formatClock(best) }));
    } else if (best != null && shownSeconds(best) < shownSeconds(stat.time)) {
        parts.push(t('quest.record', { time: formatClock(best) }));
    }
    return parts;
});

// The next photo still to search, or the recap when there is none left
function advance() {
    clearTimeout(advanceTimeout);
    questsStore.goToNextToSearch();
}

// After a find: not while the photo grid or the help is open, the card then waits for a tap
function autoAdvance() {
    if (!gridVisible.value && !instructionsVisible.value) {
        advance();
    }
}

function preloadUpcomingImage() {
    if (!upcomingQuest.value || upcomingQuest.value.id === currentQuest.value?.id) {
        return;
    }

    const upcomingImage = new Image();
    upcomingImage.src = upcomingQuest.value.url;
}

// --- Quest changes (navigation, found, level change) ---

watch(currentQuest, async () => {
    commitVisit();
    gridVisible.value = false;

    // Replaced, not pushed: the back button leaves the level instead of going back photo by photo
    router.replace({
        name: 'quest',
        params: {
            difficultyLevel: currentDifficultyLevel.value,
            imageIndex: currentQuestIndex.value + 1,
        },
    });

    resetTransform();
    startVisit();
    questsStore.rememberPosition();

    if (isQuest.value) {
        await nextTick();
        updateLayout();
        checkImageLoaded();
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

watch(upcomingQuest, preloadUpcomingImage, { immediate: true });

onMounted(() => {
    startVisit();
    questsStore.rememberPosition();
    checkImageLoaded();

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted(() => {
    commitVisit();
    clearInterval(clockInterval);
    clearTimeout(clueTimeout);
    clearTimeout(advanceTimeout);
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

    // Fades in, stays long enough to be seen, fades out (duration set from CLUE_DURATION)
    &.oea-display-clue::after,
    &.oea-display-clue::before {
        display: block;
        animation: clueShow var(--clue-duration, 200ms) ease-out forwards;

        // Without motion: shown as is for the same time, no fade
        @media (prefers-reduced-motion: reduce) {
            animation: none;
        }
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

// Alex once found: the ring follows the photo when zoomed, its line stays thin
.oea-alex-ring {
    position: absolute;
    border: calc(3px / var(--zoom, 1)) solid var(--hot);
    border-radius: 50%;
    box-shadow: 0 0 0 calc(1.5px / var(--zoom, 1)) rgba(255, 255, 255, 0.85);
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: ringIn 400ms var(--ease-out) both;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
}

@keyframes ringIn {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.3);
    }
}

@keyframes clueShow {
    0% {
        opacity: 0;
        transform: scale(1.08);
    }
    10% {
        opacity: 1;
        transform: scale(1);
    }
    72% {
        opacity: 1;
    }
    100% {
        opacity: 0;
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

.oea-top-group {
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
    // Equal gaps between the four buttons
    display: flex;
    align-items: center;
    justify-content: space-between;
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

// Clue and photo grid: same box, icon over label. The clue stays discreet on purpose
// (it costs, and the "noob" sound says so); red is kept for Alex.
.oea-dock-tool {
    width: 4.5rem;
    height: 2.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0;
    border: 0;
    border-radius: 0.75rem;
    background: none;
    font-size: 0.6875rem;
    line-height: 1;
    cursor: pointer;
    transition:
        background-color 150ms ease,
        transform 150ms var(--ease-out);

    &:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.12);
    }

    &:not(:disabled):active {
        transform: scale(0.94);
    }

    &:disabled {
        cursor: default;
    }

    // Stuck for a while without any clue: a slow, discreet halo
    &.is-nudging {
        animation: compassNudge 2.4s ease-in-out infinite;

        // Without motion, the halo stays on instead of pulsing
        @media (prefers-reduced-motion: reduce) {
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.22);
        }
    }
}

.oea-dock-icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;

    img,
    svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    img {
        filter: brightness(0) invert(1);
    }
}

.oea-compass-count {
    position: absolute;
    top: -0.45rem;
    right: -0.75rem;
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

// Nothing left to find on this photo
.oea-dock-tool.is-off {
    opacity: 0.35;
}

// --- Found card, just above the dock ---

.oea-found {
    position: absolute;
    left: 50%;
    bottom: calc(0.875rem + 3.75rem + 0.5rem + var(--safe-bottom));
    z-index: 2;
    transform: translateX(-50%);
    width: min(calc(100% - 1.5rem), 20rem);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    border-radius: 1.25rem;
    background: var(--glass);
    color: var(--on-glass);
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    box-shadow:
        inset 0 0 0 1px var(--glass-line),
        0 12px 32px -12px rgba(0, 0, 0, 0.55);
}

.oea-found-text {
    min-width: 0;
    display: grid;
    gap: 0.125rem;

    b {
        font-size: 0.9375rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }
}

// Clues, misses, record: each one whole, wrapping between them on narrow screens
.oea-found-details {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.4em;
    font-size: 0.6875rem;
    opacity: 0.8;

    span {
        white-space: nowrap;
    }

    span:not(:last-child)::after {
        content: ' ·';
    }
}

.oea-found-next {
    position: relative;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    height: 2.5rem;
    padding: 0 0.75rem 0 1rem;
    border: 0;
    border-radius: var(--radius-pill);
    overflow: hidden;
    background: #fff;
    color: #0f0f12;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 150ms var(--ease-out);

    &:active {
        transform: scale(0.96);
    }

    svg {
        width: 1rem;
        height: 1rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    // Just found: the bar runs out when the next photo comes
    &.is-counting::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background: rgba(15, 15, 18, 0.25);
        transform-origin: left;
        animation: advanceCountdown var(--advance-delay) linear forwards;
    }
}

@keyframes advanceCountdown {
    from {
        transform: scaleX(1);
    }
    to {
        transform: scaleX(0);
    }
}

.oea-found-enter-active {
    transition:
        opacity 200ms ease,
        transform 200ms var(--ease-out);
}

.oea-found-leave-active {
    transition: opacity 120ms ease;
}

.oea-found-enter-from {
    opacity: 0;
    transform: translate(-50%, 0.5rem);
}

.oea-found-leave-to {
    opacity: 0;
}

@keyframes compassNudge {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
    50% {
        box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.2);
    }
}
</style>
