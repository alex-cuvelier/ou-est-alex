<template>
    <div class="oea-quest-stats">
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">Timer</span>
            <span class="oea-quest-stat-value">{{ timer }}</span>
        </div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">Indice</span>
            <span class="oea-quest-stat-value">{{ clueCount }}</span>
        </div>
        <div class="oea-quest-stat">
            <span class="oea-quest-stat-title">Non</span>
            <span class="oea-quest-stat-value">{{ noCount }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    timer: Number,
    clueCount: Number,
    noCount: Number,
});
</script>
