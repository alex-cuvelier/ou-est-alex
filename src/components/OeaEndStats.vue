<template>
    <div class="oea-end-stats">
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">{{ $t('end.found') }}</span>
            <span class="oea-end-stat-value">{{ endStats.found }} / {{ questsCount - 1 }}</span>
        </div>
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">{{ $t('end.errors') }}</span>
            <span class="oea-end-stat-value">{{ endStats.noCount }}</span>
        </div>
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">{{ $t('end.clues') }}</span>
            <span class="oea-end-stat-value">{{ endStats.clueCount }}</span>
        </div>
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">{{ $t('end.time') }}</span>
            <span class="oea-end-stat-value">{{ formatMillisecondsToTime(endStats.time) }}</span>
        </div>
        <div class="oea-end-button-container">
            <button class="oea-btn" @click="questsStore.resetQuests">{{ $t('end.restart') }}</button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { formatMillisecondsToTime } from '@/utils/utils.js';
import { useQuestsStore } from '@/stores/questsStore.js';
const questsStore = useQuestsStore();
const { questsCount, questsStats } = storeToRefs(questsStore);

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
</script>
