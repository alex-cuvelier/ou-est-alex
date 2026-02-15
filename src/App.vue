<template>
    <OeaHeader @showInstructions="showInstructions = true" />
    <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
            <component :is="Component" />
        </Transition>
    </RouterView>
    <Toast />
    <OeaInstructionsDialog v-model:visible="showInstructions" @update:visible="onInstructionsClose" />
</template>
<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import OeaHeader from '@/components/OeaHeader.vue';
import OeaInstructionsDialog from '@/components/OeaInstructionsDialog.vue';

import { useQuestsStore } from '@/stores/questsStore.js';
import { useRoute } from 'vue-router';

const questsStore = useQuestsStore();
const route = useRoute();

const showInstructions = ref(false);

function handleKeyboardNavigation(e) {
    if (e.key === 'ArrowRight') {
        questsStore.goToNextQuest();
    } else if (e.key === 'ArrowLeft') {
        questsStore.goToPreviousQuest();
    }
}

function onInstructionsClose(visible) {
    // When dialog closes, save to localStorage
    if (!visible) {
        localStorage.setItem('instructionsShown', 'true');
    }
}

// Show instructions once on first quest load
watch(
    () => route.name,
    (name) => {
        if (name === 'quest' && !localStorage.getItem('instructionsShown')) {
            setTimeout(() => {
                showInstructions.value = true;
            }, 300);
        }
    },
    { immediate: true },
);

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
