<template>
    <div class="oea-quest-stats">
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.difficultyLevel') }}</span>
            <span class="oea-quest-stat-value">{{ difficultyLevel + 1 }}</span>
        </div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">{{ $t('footer.timer') }}</span>
            <span class="oea-quest-stat-value">{{ timer }}</span>
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
defineProps({
    difficultyLevel: Number,
    timer: Number,
    clueCount: Number,
    noCount: Number,
});
</script>
