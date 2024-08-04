<template>
    <div class="level-chooser">
        <h1>{{ $t('level-chooser.title') }}</h1>
        <div class="levels-container">
            <button
                v-for="level in difficultyLevels"
                :key="level"
                class="oea-button"
                @click="setLevel(level)"
            >
                {{ $t('difficulty.' + level) }}
            </button>

        </div>
    </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useQuestsStore } from '@/stores/questsStore.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const questsStore = useQuestsStore();

const { currentDifficultyLevel, difficultyLevels } = storeToRefs(questsStore);


const setLevel = (difficultyLevel) => {
    currentDifficultyLevel.value = difficultyLevel;
    router.push({ name: 'quest', params: { difficultyLevel, imageIndex: 1 } });
};
</script>

<style lang="scss" scoped>
.level-chooser{
    padding: 2rem;

    h1{
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .levels-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
    }
}

</style>