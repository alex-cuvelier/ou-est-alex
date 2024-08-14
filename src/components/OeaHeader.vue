<template>
    <header>
        <a href="/">Où est Alex ?</a>
        <template v-if="route.name == 'quest'">
            <div v-if="currentQuestIndex + 1 < questsCount" class="right-buttons">
                <button class="oea-btn" :disabled="currentQuestIndex == 0" @click="questsStore.goToPreviousQuest">
                    <img class="icon" src="@/assets/icons/arrow-left-solid.svg" />
                </button>
                <span class="current-quest" @click="togglePopover"> {{ currentQuestIndex + 1 }} / {{ questsCount - 1 }} </span>
                <button class="oea-btn" :disabled="currentQuestIndex == questsCount - 2"
                    @click="questsStore.goToNextQuest">
                    <img class="icon" src="@/assets/icons/arrow-right-solid.svg" />
                </button>
            </div>
            <span v-else> Fin </span>
        </template>
        <Popover ref="op" appendTo="self">
            <div class="quest-popover">
                <div 
                    v-for="i in questsCount - 1" 
                    class="quest-popover-item"
                    :class="{ active: i == currentQuestIndex + 1 }"
                    @click="goToQuest(i-1)">
                    {{ i }}
                </div>
            </div>
        </Popover>
    </header>
</template>
<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuestsStore } from '@/stores/questsStore.js';
import { useRoute } from 'vue-router';

const questsStore = useQuestsStore();
const { currentQuestIndex, questsCount } = storeToRefs(questsStore);

const route = useRoute();

const op = ref();

const togglePopover = (event) => {
    op.value.toggle(event);
}

const goToQuest = index => {
    op.value.hide();
    questsStore.setCurrentQuestIndex(index);
}
</script>
