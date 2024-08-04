<template>
       <header>
        <a href="/">Où est Alex ?</a>
        <template v-if="route.name == 'quest'">
            <div v-if="currentQuestIndex + 1 < questsCount" class="right-buttons">
                <button class="oea-btn" :disabled="currentQuestIndex == 0" @click="questsStore.goToPreviousQuest">
                    <img class="icon" src="@/assets/icons/arrow-left-solid.svg" />
                </button>
                <span> {{ currentQuestIndex + 1 }} / {{ questsCount - 1 }} </span>
                <button class="oea-btn" :disabled="currentQuestIndex == questsCount - 2" @click="questsStore.goToNextQuest">
                    <img class="icon" src="@/assets/icons/arrow-right-solid.svg" />
                </button>
            </div>
            <span v-else> Fin </span>
        </template>
    </header>
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { useQuestsStore } from '@/stores/questsStore.js';
import { useRoute } from 'vue-router';

const questsStore = useQuestsStore();
const { currentQuestIndex, questsCount } = storeToRefs(questsStore);

const route = useRoute();
</script>
