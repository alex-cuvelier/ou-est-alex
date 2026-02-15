<template>
    <div class="oea-view-wrapper">
        <main :class="{ 'oea-quest': currentQuest?.type == 'quest' }">
            <div
                v-if="currentQuest?.type == 'quest'"
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
                <img ref="image" class="oea-img" :src="currentQuest.url" />
            </div>
            <oea-end-stats v-else></oea-end-stats>

            <button v-if="currentQuest?.type == 'quest'" class="oea-ask-clue" :title="$t('header.ask-clue')" :disabled="displayClue" @click="showClue">
                <img src="@/assets/icons/circle-question-solid.svg" />
            </button>
        </main>
        <oea-current-quest-stats
            v-if="currentQuest?.type == 'quest'"
            :difficultyLevel="currentQuest.difficultyLevel"
            :timer="timer"
            :clueCount="questStats.clueCount"
            :noCount="questStats.noCount"
        >
        </oea-current-quest-stats>
    </div>
</template>

<script setup>
import OeaCurrentQuestStats from '@/components/OeaCurrentQuestStats.vue';
import OeaEndStats from '@/components/OeaEndStats.vue';

import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useQuestsStore } from '@/stores/questsStore.js';
import { pointInPolygon, toPolygon, getPolygonCenter, getRandomPointInCircle } from '@/utils/utils.js';
import confetti from '@/composables/useConfetti';
import useImageZoom from '@/composables/useImageZoom.js';

import { playOk, playKo, playNoob } from '@/composables/useSounds.js';

const route = useRoute();
const router = useRouter();

const questsStore = useQuestsStore();
const { currentDifficultyLevel, currentQuest, nextQuest, currentQuestIndex, questsStats } = storeToRefs(questsStore);

const questStats = ref({});
const timer = ref(0);
let timerInterval = null;

timerInterval = setInterval(() => {
    timer.value++;
}, 1000);
questsStore.currentDifficultyLevel = route?.params?.difficultyLevel != 'all' ? parseInt(route?.params?.difficultyLevel || 0) : 'all';
questsStore.setCurrentQuestIndex(parseInt(route?.params?.imageIndex || 1) - 1);

const imageWrapper = ref(null);
const clueSize = ref(0);
const clueSizeWithUnit = computed(() => clueSize.value + 'px');
const displayClue = ref(false);

const isShaking = ref(false);
const {
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

function checkAlexFound(event) {
    const xRatio = event.target.naturalWidth / event.target.width;
    const yRatio = event.target.naturalHeight / event.target.height;
    const polygon = toPolygon(currentQuest.value.coords, xRatio, yRatio);
    const isInside = pointInPolygon(polygon, event.offsetX, event.offsetY);

    if (isInside) {
        onAlexFound(event);
    } else {
        playKo();
        questStats.value.noCount++;
        isShaking.value = true;
        setTimeout(() => {
            isShaking.value = false;
        }, 400);
    }
}

async function onAlexFound(event) {
    playOk();
    confetti.start();
    questStats.value.found = true;

    const xRatio = event.target.naturalWidth / event.target.width;
    const yRatio = event.target.naturalHeight / event.target.height;
    const polygon = toPolygon(currentQuest.value.coords, xRatio, yRatio);
    const center = getPolygonCenter(polygon);

    await animateZoomTo(center.x, center.y, 15, 1600);
    confetti.stop();
    questsStore.goToNextQuest();
}

function resetQuestStats() {
    questStats.value = {
        questId: currentQuest.id,
        start: new Date(),
        end: null,
        clueCount: 0,
        noCount: 0,
        found: false,
    };
    timer.value = 0;
}

//IMAGE WRAPPER DIMENSIONS
const wrapperStyle = ref({ height: '100%', width: '100%' });

function updateWrapperStyle() {
    /* Compute wrapper dimmensions */
    const mainDimensions = document.querySelector('main').getBoundingClientRect();
    const aspectRatio = currentQuest.value.width / currentQuest.value.height;
    const containerAspectRatio = mainDimensions.width / mainDimensions.height;

    let newWidth, newHeight;
    if (aspectRatio > containerAspectRatio) {
        newWidth = mainDimensions.width;
        newHeight = mainDimensions.width / aspectRatio;
    } else {
        newHeight = mainDimensions.height;
        newWidth = mainDimensions.height * aspectRatio;
    }

    /* Compute clue circle position*/
    const xRatio = currentQuest.value.width / newWidth;
    const yRatio = currentQuest.value.height / newHeight;
    const polygon = toPolygon(currentQuest.value.coords, xRatio, yRatio);
    const polygonCenter = getPolygonCenter(polygon);
    const clueCenter = getRandomPointInCircle(polygonCenter.x, polygonCenter.y, clueSize.value / 2 - 20);

    wrapperStyle.value = {
        height: newHeight + 'px',
        width: newWidth + 'px',
        '--clueCenterY': clueCenter.y - clueSize.value / 2 + 'px',
        '--clueCenterX': clueCenter.x - clueSize.value / 2 + 'px',
    };
}

function showClue() {
    playNoob();
    displayClue.value = true;
    questStats.value.clueCount++;
    setTimeout(() => {
        displayClue.value = false;
        if (clueSize.value > 50) {
            clueSize.value = clueSize.value * 0.8;
        }
        updateWrapperStyle();
    }, 100);
}

function preloadNextImage() {
    if (nextQuest?.value?.type != 'quest') {
        return;
    }

    const nextImage = new Image();
    nextImage.src = nextQuest.value.url;
}

//ZOOM
function resetClueSize() {
    const mainDimensions = document.querySelector('main').getBoundingClientRect();
    clueSize.value = Math.min(mainDimensions.width, mainDimensions.height);
}

onMounted(() => {
    if (currentQuest.value.type == 'end' && questsStats.value.length == 0) {
        // location.href = '/';
    }

    resetClueSize();
    resetQuestStats();
    updateWrapperStyle();

    document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.removeEventListener('mouseup', onMouseUp);
});

//change url on quest change
watch(currentQuestIndex, (value, oldValue) => {
    router.push({
        name: 'quest',
        params: {
            difficultyLevel: currentDifficultyLevel.value,
            imageIndex: value + 1,
        },
    });
    resetTransform();
    resetClueSize();

    if (value === oldValue + 1 || value == oldValue - 1) {
        questStats.value.end = new Date();
        questsStore.pushQuestStats({
            ...questStats.value,
        });
        resetQuestStats();
    }

    if (currentQuest.value.type == 'quest') {
        updateWrapperStyle();
    }
});

// Reset stats when difficulty level changes
watch(currentDifficultyLevel, () => {
    questsStore.resetQuests();
    resetQuestStats();
});

watch(currentQuestIndex, preloadNextImage, { immediate: true });
</script>

<style lang="scss">
/* Wrapper pour éviter le warning Vue Transition */
.oea-view-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex: 1;
}

/* Clue circles */
.oea-image-wrapper {
    &.oea-display-clue {
        &::after,
        &::before {
            display: block;
            animation: clueGlow 2s ease-in-out infinite;
        }
    }

    &::after,
    &::before {
        content: '';
        display: none;
        position: absolute;
        border-radius: 50%;
    }

    // Cercle extérieur avec glow rose
    &::after {
        top: var(--clueCenterY);
        left: var(--clueCenterX);
        width: v-bind(clueSizeWithUnit);
        height: v-bind(clueSizeWithUnit);
        border: 3px solid rgba(var(--color-pink-rgb), 0.8);
        box-shadow:
            0 0 20px var(--glow-pink),
            0 0 40px var(--glow-pink),
            0 0 60px rgba(var(--color-pink-rgb), 0.4),
            inset 0 0 20px rgba(var(--color-pink-rgb), 0.1);
    }

    // Cercle intérieur avec bordure blanche subtile
    &::before {
        top: calc(var(--clueCenterY) + 4px);
        left: calc(var(--clueCenterX) + 4px);
        width: calc(v-bind(clueSizeWithUnit) - 8px);
        height: calc(v-bind(clueSizeWithUnit) - 8px);
        border: 2px solid rgba(var(--white-rgb), 0.6);
        box-shadow:
            0 0 10px rgba(var(--white-rgb), 0.3),
            inset 0 0 10px rgba(var(--color-pink-rgb), 0.2);
    }
}

// Shake animation on wrong answer (applied to img to avoid conflicting with wrapper transform)
.oea-image-wrapper.oea-shaking .oea-img {
    animation: imgShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
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

// Animation de pulse pour le glow de l'indice
@keyframes clueGlow {
    0%,
    100% {
        opacity: 0.8;
    }
    50% {
        opacity: 1;
    }
}
</style>
