<template>
    <main>
        <img
            class="oea-img"
            :src="currentQuest.url"
            :style="imageStyle"
            @mousedown="onmousedown"
            @mouseup="onmouseup"
            @mousemove="onmousemove"
            @wheel="onwheel"
        />
    </main>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useSound } from '@vueuse/sound';

import { useQuestsStore } from '@/stores/quests.js';
import { pointInPolygon, toPolygon } from '@/utils/utils.js';
import confetti from '@/composables/useConfetti';

import okSound from '@/assets/sounds/ok.mp3';
import koSound from '@/assets/sounds/ko.mp3';

const route = useRoute();
const questsStore = useQuestsStore();
const { currentQuest } = storeToRefs(questsStore);

const { play: playOk } = useSound(okSound);
const { play: playKo } = useSound(koSound);

questsStore.setCurrentQuestIndex(parseInt(route?.params?.imageIndex || 1) - 1);

const checkAlexFound = (event) => {
    const { offsetX, offsetY } = event;
    const point = [offsetX, offsetY];
    const naturalHeight = event.target.naturalHeight;
    const naturalWidth = event.target.naturalWidth;
    const xRatio = naturalWidth / event.target.width;
    const yRatio = naturalHeight / event.target.height;
    const polygon = toPolygon(currentQuest.value.coords);
    const scaledPolygon = polygon.map((coord) => [coord[0] / xRatio, coord[1] / yRatio]);
    const isInside = pointInPolygon(scaledPolygon, point);

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

//ZOOM
const scale = ref(1),
    pointX = ref(0),
    pointY = ref(0);
let panning = false,
    start = { x: 0, y: 0 },
    pointSaved = { x: 0, y: 0 };

const imageStyle = computed(() => {
    return {
        transform: `translate(${pointX.value}px, ${pointY.value}px) scale(${scale.value})`,
    };
});

function resetTransform() {
    scale.value = 1;
    pointX.value = 0;
    pointY.value = 0;
    //setTransform();
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

    pointX.value = e.clientX - start.x;
    pointY.value = e.clientY - start.y;
};

const onwheel = function (e) {
    e.preventDefault();

    var xs = (e.clientX - pointX.value) / scale.value,
        ys = (e.clientY - pointY.value) / scale.value,
        delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;

    if (delta > 0) {
        scale.value = (scale.value * 1.2).toFixed(2);
    } else {
        scale.value = (scale.value / 1.2).toFixed(2);
    }

    if (scale.value < 1) {
        scale.value = 1;
    }

    pointX.value = e.clientX - xs * scale.value;
    pointY.value = e.clientY - ys * scale.value;
};

watch(currentQuest, () => {
    resetTransform();
});
</script>

<style lang="scss" scoped>
.oea-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform-origin: 0px 0px;
    transform: scale(1) translate(0px, 0px);
    cursor: grab;
}
</style>
