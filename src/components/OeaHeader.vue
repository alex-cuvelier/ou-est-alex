<template>
       <header>
        <a href="/">Où est Alex ?</a>
        <template v-if="currentQuestIndex + 1 < questsCount">
            <div class="right-buttons">
                <button class="oea-btn" :disabled="currentQuestIndex == 0" @click="questsStore.goToPreviousQuest">
                    <img class="icon" src="@/assets/icons/arrow-left-solid.svg" />
                </button>
                <span> {{ currentQuestIndex + 1 }} / {{ questsCount - 1 }} </span>
                <button class="oea-btn" :disabled="currentQuestIndex == questsCount - 2" @click="questsStore.goToNextQuest">
                    <img class="icon" src="@/assets/icons/arrow-right-solid.svg" />
                </button>
            </div>
        </template>
        <span v-else> Fin </span>
    </header>
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { useQuestsStore } from '@/stores/questsStore.js';
const questsStore = useQuestsStore();
const { currentQuestIndex, questsCount } = storeToRefs(questsStore);
</script>
