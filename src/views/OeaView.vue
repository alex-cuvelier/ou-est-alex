<template>
    <header>
        <a href="/">Où est Alex ?</a>
        <button class="oea-btn ask-clue" @click="showClue" :disabled="displayClue">
            <font-awesome-icon icon="question-circle" size="lg" />
        </button>
        <div>
            <button class="oea-btn" @click="questsStore.previousQuest">
                <font-awesome-icon icon="arrow-left" size="sm" />
            </button>
            {{ currentQuestIndex + 1 }} / {{ questsCount }}
            <button class="oea-btn" @click="questsStore.nextQuest">
                <font-awesome-icon icon="arrow-right" size="sm" />
            </button>
        </div>
    </header>
    <main>
        <div
            ref="image-wrapper"
            class="oea-image-wrapper"
            :class="{ displayClue: displayClue }"
            :style="{ ...wrapperStyle, ...transformStyle }"
            @mousedown="onMouseDown"
            @mouseup="onMouseUp"
            @mousemove="onMouseMove"
            @wheel="onWheel"
        >
            <img ref="image" class="oea-img" :src="currentQuest.url" />
        </div>
    </main>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useQuestsStore } from '@/stores/quests.js';
import { pointInPolygon, toPolygon, getPolygonCenter, getRandomPointInCircle } from '@/utils/utils.js';
import confetti from '@/composables/useConfetti';

import { playOk, playKo, playNoob } from '@/composables/useSounds.js';

const route = useRoute();
const router = useRouter();

const questsStore = useQuestsStore();
const { currentQuest, currentQuestIndex, questsCount } = storeToRefs(questsStore);

questsStore.setCurrentQuestIndex(parseInt(route?.params?.imageIndex || 1) - 1);

const clueSize = ref(0);
const clueSizeWithUnit = computed(() => clueSize.value + 'px');
const displayClue = ref(false);

function checkAlexFound(event) {

    const xRatio = event.target.naturalWidth / event.target.width;
    const yRatio = event.target.naturalHeight / event.target.height;
    const polygon = toPolygon(currentQuest.value.coords, xRatio, yRatio);
    const isInside = pointInPolygon(polygon, event.offsetX, event.offsetY);

    if (isInside) {
        onAlexFound();
    } else {
        playKo();
    }
};

function onAlexFound (){
    playOk();
    confetti.start();
    questsStore.nextQuest();
    setTimeout(() => {
        confetti.stop();
    }, 1500);
};

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

function showClue(){
    playNoob();
    displayClue.value = true;
    setTimeout(() => {
        displayClue.value = false;
        if (clueSize.value > 50) {
            clueSize.value = clueSize.value * 0.8;
        }
        updateWrapperStyle();
    }, 100);
};

//ZOOM
const scale = ref(1),
    pointX = ref(0),
    pointY = ref(0);
let panning = false,
    start = { x: 0, y: 0 },
    pointSaved = { x: 0, y: 0 };

const transformStyle = computed(() => {
    return {
        transform: `translate(${pointX.value}px, ${pointY.value}px) scale(${scale.value})`,
    };
});

function resetTransform() {
    scale.value = 1;
    pointX.value = 0;
    pointY.value = 0;
}

function onMouseDown(e) {
    e.preventDefault();
    start = { x: e.clientX - pointX.value, y: e.clientY - pointY.value };
    panning = true;
    pointSaved = { x: pointX.value, y: pointY.value };
};

function onMouseUp(e) {
    panning = false;

    //Check if is a click or a drag
    if (pointSaved.x == pointX.value && pointSaved.y == pointY.value) {
        checkAlexFound(e);
    }
};

function onMouseMove (e) {
    e.preventDefault();
    if (!panning) {
        return;
    }

    let newXValue = e.clientX - start.x;
    let newYValue = e.clientY - start.y;
    const xDifference = pointX.value + newXValue;
    const yDifference = pointY.value + newYValue;

    const threshold = 10 * scale.value;
    if (xDifference < threshold && yDifference > -threshold && yDifference < threshold && yDifference > -threshold) {
        return;
    }

    pointX.value = newXValue;
    pointY.value = newYValue;
};

function onWheel (event) {
    event.preventDefault();

    const img = event.target;
    const rec = img.getBoundingClientRect();
    const x = (event.clientX - rec.x) / scale.value;
    const y = (event.clientY - rec.y) / scale.value;

    const delta = event.wheelDelta ? event.wheelDelta : -event.deltaY;

    if (scale.value == 1 && delta < 0) {
        resetTransform();
        return;
    }

    if (delta > 0) {
        if (scale.value > 10) {
            return;
        }
        scale.value = parseFloat((scale.value + 0.4).toFixed(1));
    } else {
        if (scale.value <= 1) {
            return;
        }
        scale.value = parseFloat((scale.value - 0.4).toFixed(1));
    }

    const m = delta > 0 ? 0.2 : -0.2;
    pointX.value += -x * m * 2 + img.offsetWidth * m;
    pointY.value += -y * m * 2 + img.offsetHeight * m;
};

function resetClueSize () {
    const mainDimensions = document.querySelector('main').getBoundingClientRect();
    clueSize.value = Math.min(mainDimensions.width, mainDimensions.height);
};

onMounted(() => {
    resetClueSize();
    updateWrapperStyle();
});

//change url on quest change
watch(currentQuestIndex, (value) => {
    router.push({
        name: 'homeIndex',
        params: {
            imageIndex: value + 1,
        },
    });
    resetTransform();
    resetClueSize();
    updateWrapperStyle();
});

//reset transform on scale reset
watch(scale, (value) => {
    if (value == 1) {
        resetTransform();
    }
});
</script>

<style lang="scss">
/* Clue circles */
.oea-image-wrapper {

    &.displayClue{
        &::after,
        &::before  {
            display: block;
        }
    }

    &::after,
    &::before {
        content: '';
        display: none;
        position: absolute;
        border-radius: 50%;
        border-radius: 50%;
    }

    &::after {
        top: var(--clueCenterY);
        left: var(--clueCenterX);
        width: v-bind(clueSizeWithUnit);
        height: v-bind(clueSizeWithUnit);
        border: 2px solid black;
    }

    &::before {
        top: calc(var(--clueCenterY) + 1px);
        left: calc(var(--clueCenterX) + 1px);
        width: calc(v-bind(clueSizeWithUnit) - 2px);
        height: calc(v-bind(clueSizeWithUnit) - 2px);
        border: 2px solid white;
    }
}
</style>
