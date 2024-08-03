<template>
    <div class="oea-end-stats">
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">Trouvés</span>
            <span class="oea-end-stat-value">{{ endStats.found }} / {{ questsCount - 1 }}</span>
        </div>
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">Erreurs</span>
            <span class="oea-end-stat-value">{{ endStats.noCount }}</span>
        </div>
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">Indices</span>
            <span class="oea-end-stat-value">{{ endStats.clueCount }}</span>
        </div>
        <div class="oea-end-stat">
            <span class="oea-end-stat-title">Temps</span>
            <span class="oea-end-stat-value">{{
                formatDuration(
                    intervalToDuration({
                        start: 0,
                        end: endStats.time * 1000,
                    }),
                    { locale: fr },
                )
            }}</span>
        </div>
        <div class="oea-end-button-container">
            <button class="oea-btn" @click="questsStore.resetQuests">Recommencer</button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { intervalToDuration, formatDuration } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuestsStore } from '@/stores/quests.js';
const questsStore = useQuestsStore();
const { questsCount, questsStats } = storeToRefs(questsStore);

const endStats = computed(() => {
    return questsStats.value.reduce(
        (acc, stat) => {
            acc.found += stat.found ? 1 : 0;
            acc.noCount += stat.noCount;
            acc.clueCount += stat.clueCount;
            acc.time += intervalToDuration({
                start: stat.start,
                end: stat.end,
            }).seconds;
            return acc;
        },
        { found: 0, noCount: 0, clueCount: 0, time: 0 },
    );
});
</script>
