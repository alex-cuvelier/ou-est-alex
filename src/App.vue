<template>
    <OeaHeader />
    <RouterView />
    <Toast />
</template>
<script setup>
import OeaHeader from '@/components/OeaHeader.vue';

import { useQuestsStore } from '@/stores/questsStore.js';
const questsStore = useQuestsStore();

document.onkeydown = function(e) {
    if(e.key == 'ArrowRight') {
        questsStore.goToNextQuest();
    }else if(e.key == 'ArrowLeft') {
        questsStore.goToPreviousQuest();
    }
}

</script>
