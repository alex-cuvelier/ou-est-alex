<template>
    <header>
        <a href="/">Où est Alex ?</a>
        <template v-if="route.name == 'quest'">
            <div v-if="currentQuestIndex + 1 < questsCount" class="right-buttons">
                <button class="oea-btn" :disabled="currentQuestIndex == 0" @click="questsStore.goToPreviousQuest">
                    <img class="icon" src="@/assets/icons/arrow-left-solid.svg" />
                </button>
                <span class="current-quest" @click="togglePopover"> {{ currentQuestIndex + 1 }} / {{ questsCount - 1 }}
                </span>
                <button class="oea-btn" :disabled="currentQuestIndex == questsCount - 2"
                    @click="questsStore.goToNextQuest">
                    <img class="icon" src="@/assets/icons/arrow-right-solid.svg" />
                </button>
            </div>
            <span v-else> Fin </span>
        </template>
        <Drawer v-model:visible="drawerVisible" :header="$t('header.chooseQuest')" appendTop="self" position="top"
            style="height: auto">
            <div class="quest-drawer">
                <Button 
                    v-for="i in questsCount - 1" 
                    class="quest-drawer-item" 
                    :outlined="currentQuestIndex + 1 != i"
                    raised 
                    :severity="getQuestSeverity(i)"
                    @click="goToQuest(i - 1)">
                    <span v-if="questsStore.isQuestCompleted(i)" class="completed">✓</span>
                    <span v-else-if="questsStore.isQuestFailed(i)" class="failed">✗</span>
                     {{ i }}
            </Button>
            </div>
        </Drawer>
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

const drawerVisible = ref(false);

const togglePopover = (event) => {
    drawerVisible.value = !drawerVisible.value;
}

const goToQuest = index => {
    drawerVisible.value = false;
    questsStore.setCurrentQuestIndex(index);
}

const getQuestSeverity = (index) => {
    if(index == currentQuestIndex.value + 1) {
        return 'warn';
    }else if(questsStore.isQuestCompleted(index)) {
        return 'success';
    }else if (questsStore.isQuestFailed(index)) {
        return 'danger';
    }else {
        return 'contrast';
    }
}
</script>
