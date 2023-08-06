<template>
    <header>
        <a href="/">Où est Alex ?</a>
        <button class="oea-btn ask-clue" @click="showClue" :disabled="clueDisplay != 'none'">
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
            :style="{ ...wrapperStyle, ...transformStyle }"
            @mousedown="onmousedown"
            @mouseup="onmouseup"
            @mousemove="onmousemove"
            @wheel="onwheel"
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
const clueDisplay = ref('none');

const checkAlexFound = (event) => {

    const xRatio = event.target.naturalWidth / event.target.width;
    const yRatio = event.target.naturalHeight / event.target.height;
    const polygon = toPolygon(currentQuest.value.coords, xRatio, yRatio);
    const isInside = pointInPolygon(polygon, event.offsetX, event.offsetY);

    if (isInside) {
        alexFound();
    } else {
        playKo();
    }
};

const alexFound = () => {
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
    const main = document.querySelector('main');
    const mainDimensions = main.getBoundingClientRect();
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

const showClue = () => {
    playNoob();
    clueDisplay.value = 'block';
    setTimeout(() => {
        clueDisplay.value = 'none';
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

const onmousedown = function (e) {
    e.preventDefault();
    start = { x: e.clientX - pointX.value, y: e.clientY - pointY.value };
    panning = true;
    pointSaved = { x: pointX.value, y: pointY.value };
};

const onmouseup = function (e) {
    panning = false;

    //Check if is a click or a drag
    if (pointSaved.x == pointX.value && pointSaved.y == pointY.value) {
        checkAlexFound(e);
    }
};

const onmousemove = function (e) {
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

const onwheel = function (e) {
    e.preventDefault();

    const img = e.target;
    const rec = img.getBoundingClientRect();
    const x = (e.clientX - rec.x) / scale.value;
    const y = (e.clientY - rec.y) / scale.value;

    const delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;

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

onMounted(() => {
    const mainDimensions = document.querySelector('main').getBoundingClientRect();
    clueSize.value = Math.min(mainDimensions.width, mainDimensions.height);
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
    const mainDimensions = document.querySelector('main').getBoundingClientRect();
    clueSize.value = Math.min(mainDimensions.width, mainDimensions.height);
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
    &::after,
    &::before {
        content: '';
        position: absolute;
        border-radius: 50%;
        display: v-bind(clueDisplay);
        border-radius: 50%;
        display: v-bind(clueDisplay);
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
