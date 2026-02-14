<template>
    <OeaHeader />
    <RouterView />
    <Toast />
</template>
<script setup>
import { onMounted, onUnmounted } from 'vue';
import OeaHeader from '@/components/OeaHeader.vue';

import { useQuestsStore } from '@/stores/questsStore.js';
const questsStore = useQuestsStore();

function handleKeyboardNavigation(e) {
    if (e.key === 'ArrowRight') {
        questsStore.goToNextQuest();
    } else if (e.key === 'ArrowLeft') {
        questsStore.goToPreviousQuest();
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeyboardNavigation);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyboardNavigation);
});

</script>
