<template>
    <header>
        <a href="/">Où est Alex ?</a>
        <template v-if="route.name == 'quest'">
            <div v-if="currentQuestIndex + 1 < questsCount" class="oea-right-buttons">
                <button class="oea-btn" :disabled="currentQuestIndex == 0" @click="questsStore.goToPreviousQuest">
                    <img class="oea-icon" src="@/assets/icons/arrow-left-solid.svg" />
                </button>
                <span class="oea-current-quest" @click="togglePopover"> {{ currentQuestIndex + 1 }} / {{ questsCount - 1 }} </span>
                <button class="oea-btn" :disabled="currentQuestIndex == questsCount - 2" @click="questsStore.goToNextQuest">
                    <img class="oea-icon" src="@/assets/icons/arrow-right-solid.svg" />
                </button>
            </div>
            <span v-else> Fin </span>
        </template>
        <Drawer
            v-model:visible="drawerVisible"
            :header="$t('header.chooseQuest')"
            appendTop="self"
            position="top"
            class="oea-vibrant-drawer"
            style="height: auto"
        >
            <div class="oea-quest-drawer">
                <Button
                    v-for="i in questsCount - 1"
                    :key="i"
                    class="oea-quest-drawer-item"
                    :outlined="currentQuestIndex + 1 != i"
                    raised
                    :severity="getQuestSeverity(i)"
                    @click="goToQuest(i - 1)"
                >
                    <span v-if="questsStore.isQuestCompleted(i)" class="oea-completed">✓</span>
                    <span v-else-if="questsStore.isQuestFailed(i)" class="oea-failed">✗</span>
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

<style scoped lang="scss">
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
.oea-completed,
.oea-failed {
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

.oea-completed {
    background: var(--color-success);
    color: white;
}

.oea-failed {
    background: var(--color-error);
    color: white;
}

/* Animation des items du drawer au survol */
.oea-quest-drawer-item {
    position: relative;
}

.oea-quest-drawer-item:hover {
    z-index: 1;
}

/* Styling du Drawer vibrant */
.oea-vibrant-drawer {
    :deep(.p-drawer) {
        background: rgba(10, 14, 39, 0.95);
        backdrop-filter: blur(20px) saturate(180%);
        border: none;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;

        // Gradient border en bas
        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--color-purple), var(--color-pink), var(--color-cyan));
            z-index: 1;
        }
    }

    :deep(.p-drawer-header) {
        background: transparent;
        border: none;
        padding: 1.5rem;
        color: white;
    }

    :deep(.p-drawer-title) {
        font-size: 1.5rem;
        font-weight: 700;
        background: var(--gradient-vibrant);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    :deep(.p-drawer-header-actions) {
        button {
            background: transparent;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: var(--radius-sm);
            color: white;
            transition: all var(--transition-base);

            &:hover {
                background: rgba(139, 92, 246, 0.2);
                border-color: var(--color-purple);
                box-shadow: 0 0 20px var(--glow-purple);
            }
        }
    }

    :deep(.p-drawer-content) {
        background: transparent;
        padding: 0;
    }
}

.oea-quest-drawer {
    background: transparent;
}
</style>
