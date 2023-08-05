<template>
    <main>
        <img class="oea-img" :src="currentQuest.url" @click="onImageClick" />
    </main>
</template>

<script setup>
import { pointInPolygon, toPolygon } from '@/utils/utils.js';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia'
import { useQuestsStore } from '@/stores/quests.js';

const route = useRoute();
const questsStore = useQuestsStore();
const { currentQuest } = storeToRefs(questsStore);

questsStore.setCurrentQuestIndex(parseInt(route?.params?.imageIndex || 1) - 1);

const onImageClick = (event) => {
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
        questsStore.nextQuest();
    }
};
</script>

<style lang="scss" scoped>
.oea-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>
```
