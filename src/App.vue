<template>
    <OeaHeader v-if="route.name === 'addImage'" />
    <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
            <component :is="Component" />
        </Transition>
    </RouterView>
    <Toast />
    <OeaInstructionsDialog v-model:visible="instructionsVisible" @update:visible="onInstructionsClose" />
</template>
<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import OeaHeader from '@/components/OeaHeader.vue';
import OeaInstructionsDialog from '@/components/OeaInstructionsDialog.vue';

import { useQuestsStore } from '@/stores/questsStore.js';
import { useUiStore } from '@/stores/uiStore.js';

const questsStore = useQuestsStore();
const { instructionsVisible } = storeToRefs(useUiStore());
const route = useRoute();

function handleKeyboardNavigation(e) {
    if (route.name !== 'quest' || instructionsVisible.value) {
        return;
    }

    if (e.key === 'ArrowRight') {
        questsStore.goToNextQuest();
    } else if (e.key === 'ArrowLeft') {
        questsStore.goToPreviousQuest();
    }
}

function onInstructionsClose(visible) {
    // When dialog closes, save to localStorage
    if (!visible) {
        try {
            localStorage.setItem('instructionsShown', 'true');
        } catch {
            // Private browsing: the instructions will show again next visit
        }
    }
}

function instructionsAlreadyShown() {
    try {
        return Boolean(localStorage.getItem('instructionsShown'));
    } catch {
        return false;
    }
}

// Show instructions once on first quest load
watch(
    () => route.name,
    (name) => {
        if (name === 'quest' && !instructionsAlreadyShown()) {
            setTimeout(() => {
                instructionsVisible.value = true;
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
/* Transitions de page : fondu court */
.page-enter-active,
.page-leave-active {
    transition: opacity 180ms ease;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
}
</style>
