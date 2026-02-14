<template>
    <div class="oea-quest-stats">
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-value">{{ $t('difficulty.' + difficultyLevel) }}</span>
        </div>
        <div class="oea-quest-stat-divider"></div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-value">{{ formmatSecondsToTime(timer) }}</span>
        </div>
        <div class="oea-quest-stat-divider"></div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.clue') }}</span>
            <span class="oea-quest-stat-value" :key="clueCount">{{ clueCount }}</span>
        </div>
        <div class="oea-quest-stat-divider"></div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.no') }}</span>
            <span class="oea-quest-stat-value" :key="noCount">{{ noCount }}</span>
        </div>
    </div>
</template>

<script setup>
import { formmatSecondsToTime } from '@/utils/utils.js';

defineProps({
    difficultyLevel: Number,
    timer: Number,
    clueCount: Number,
    noCount: Number,
});
</script>

<style scoped>
/* Animation des valeurs qui changent */
.oea-quest-stat-value {
    display: inline-block;
    animation: numberPulse 0.3s ease;
}

/* Icônes ou indicateurs visuels pour les stats */
.oea-quest-stat-title {
    color: var(--color-text-secondary);
    font-size: 0.9em;
}
</style>
