<template>
    <header>
        <a href="/">Où est Alex ?</a>
        <template v-if="route.name == 'quest'">
            <div v-if="currentQuestIndex + 1 < questsCount" class="right-buttons">
                <button class="oea-btn" :disabled="currentQuestIndex == 0" @click="questsStore.goToPreviousQuest">
                    <img class="icon" src="@/assets/icons/arrow-left-solid.svg" />
                </button>
                <span class="current-quest" @click="togglePopover"> {{ currentQuestIndex + 1 }} / {{ questsCount - 1 }} </span>
                <button class="oea-btn" :disabled="currentQuestIndex == questsCount - 2" @click="questsStore.goToNextQuest">
                    <img class="icon" src="@/assets/icons/arrow-right-solid.svg" />
                </button>
            </div>
            <span v-else> Fin </span>
        </template>
        <Drawer v-model:visible="drawerVisible" :header="$t('header.chooseQuest')" appendTop="self" position="top" style="height: auto">
            <div class="quest-drawer">
                <Button
                    v-for="i in questsCount - 1"
                    :key="i"
                    class="quest-drawer-item"
                    :outlined="currentQuestIndex + 1 != i"
                    raised
                    :severity="getQuestSeverity(i)"
                    @click="goToQuest(i - 1)"
                >
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

const togglePopover = () => {
    drawerVisible.value = !drawerVisible.value;
};

const goToQuest = (index) => {
    drawerVisible.value = false;
    questsStore.setCurrentQuestIndex(index);
};

const getQuestSeverity = (index) => {
    if (index == currentQuestIndex.value + 1) {
        return 'warn';
    } else if (questsStore.isQuestCompleted(index)) {
        return 'success';
    } else if (questsStore.isQuestFailed(index)) {
        return 'danger';
    } else {
        return 'contrast';
    }
};
</script>

<style scoped>
/* Animation du logo avec underline */
header a {
    position: relative;
    transition: color var(--transition-base);
}

header a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--color-accent);
    transition: width var(--transition-base);
}

header a:hover::after {
    width: 100%;
}

/* Badges de complétion/échec */
.completed,
.failed {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    animation: scaleIn 0.4s var(--transition-bounce);
    box-shadow: 0 2px 8px var(--color-shadow);
}

.completed {
    background: var(--color-success);
    color: white;
}

.failed {
    background: var(--color-error);
    color: white;
}

/* Animation des items du drawer au survol */
.quest-drawer-item {
    position: relative;
}

.quest-drawer-item:hover {
    z-index: 1;
}
</style>
