<template>
    <div class="oea-quest-stats">
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('difficulty.' + difficultyLevel) }}</span>
        </div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.timer') }}</span>
            <span class="oea-quest-stat-value">{{ formmatSecondsToTime(timer) }}</span>
        </div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.clue') }}</span>
            <span class="oea-quest-stat-value">{{ clueCount }}</span>
        </div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.no') }}</span>
            <span class="oea-quest-stat-value">{{ noCount }}</span>
        </div>
    </div>
</template>

<script setup>
import {formmatSecondsToTime} from '@/utils/utils.js';

defineProps({
    difficultyLevel: Number,
    timer: Number,
    clueCount: Number,
    noCount: Number,
});
</script>
