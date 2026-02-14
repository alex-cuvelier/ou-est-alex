<template>
    <OeaHeader />
    <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
            <component :is="Component" />
        </Transition>
    </RouterView>
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

<style>
/* Transitions de page fluides */
.page-enter-active,
.page-leave-active {
    transition: all var(--transition-base);
}

.page-enter-from {
    opacity: 0;
    transform: translateX(10px);
}

.page-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}
</style>
