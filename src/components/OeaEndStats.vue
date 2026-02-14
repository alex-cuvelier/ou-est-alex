<template>
    <div class="oea-end-stats">

        <div class="oea-end-stats-container">
            <Card>
                <template #title>{{ $t('end.found') }}</template>
                <template #content>{{ endStats.found }} / {{ questsCount - 1 }}</template>
            </Card>
            <Card>
                <template #title>{{ $t('end.errors') }}</template>
                <template #content>{{ endStats.noCount }}</template>
            </Card>
            <Card>
                <template #title>{{ $t('end.clues') }}</template>
                <template #content>{{ endStats.clueCount }}</template>
            </Card>
            <Card>
                <template #title>{{ $t('end.time') }}</template>
                <template #content>{{ formatMillisecondsToTime(endStats.time) }}</template>
            </Card>
        </div>

        <div class="oea-end-buttons">
            <Button outlined  raised severity="contrast" @click="goToNextDifficultyLevel">
                {{ $t('end.continue') }}
            </Button>
            <Button outlined  raised severity="contrast" @click="router.push({ name: 'levelChooser' })">
                {{$t('end.chooseLevel') }}
            </Button>
            <Button outlined  raised severity="contrast" @click="questsStore.resetQuests">
                {{ $t('end.restart') }}
            </Button>

        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { formatMillisecondsToTime } from '@/utils/utils.js';
import { useQuestsStore } from '@/stores/questsStore.js';

const router = useRouter();

const questsStore = useQuestsStore();
const { questsCount, questsStats, difficultyLevels, currentDifficultyLevel, currentQuestIndex } = storeToRefs(questsStore);

const endStats = computed(() => {
    return questsStats.value.reduce(
        (acc, stat) => {
            acc.found += stat.found ? 1 : 0;
            acc.noCount += stat.noCount;
            acc.clueCount += stat.clueCount;
            acc.time += stat.end - stat.start;
            return acc;
        },
        { found: 0, noCount: 0, clueCount: 0, time: 0 },
    );
});

const goToNextDifficultyLevel = () => {
    const nextDifficultyLevel = currentDifficultyLevel.value + 1;
    if (nextDifficultyLevel < difficultyLevels.value.length) {
        currentDifficultyLevel.value = nextDifficultyLevel;
        currentQuestIndex.value = 0;
        router.push({ name: 'quest', params: { difficultyLevel: nextDifficultyLevel, imageIndex: 1 } });
    }
};
</script>

<style scoped>
/* Optimisations GPU pour les animations */
.oea-end-stats-container {
    will-change: opacity;
}

/* Amélioration des boutons */
.oea-end-buttons :deep(.p-button) {
    position: relative;
    overflow: hidden;
    font-weight: 600;
    letter-spacing: 0.025em;
    transition: all var(--transition-base);

    &:hover {
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }
}

/* Stats cards - support pour le gradient de texte */
.oea-end-stats-container :deep(.p-card-content) {
    /* Le gradient est déjà appliqué dans styles.scss */
    /* On s'assure juste que le texte est bien visible */
    font-weight: 700;
}

/* Animation des cards déjà définie dans styles.scss via fadeInUp */
</style>
