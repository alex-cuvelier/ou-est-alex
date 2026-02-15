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
            <Button outlined raised severity="contrast" @click="goToNextDifficultyLevel">
                {{ $t('end.continue') }}
            </Button>
            <Button outlined raised severity="contrast" @click="router.push({ name: 'levelChooser' })">
                {{ $t('end.chooseLevel') }}
            </Button>
            <Button outlined raised severity="contrast" @click="questsStore.resetQuests">
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

<style scoped lang="scss">
/* Container avec perspective pour effets 3D */
.oea-end-stats {
    perspective: 1000px;
}

.oea-end-stats-container {
    will-change: opacity;

    /* Transformation des cards avec glassmorphism vibrant */
    :deep(.p-card) {
        position: relative;
        background: var(--glass-bg-strong) !important;
        backdrop-filter: var(--glass-blur);
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        transition: all var(--transition-base);
        transform-style: preserve-3d;
        overflow: visible !important;

        // Gradient border animé
        &::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: inherit;
            padding: 2px;
            background: linear-gradient(135deg, var(--color-purple), var(--color-pink), var(--color-cyan));
            background-size: 200% 200%;
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            mask-composite: exclude;
            opacity: 0;
            transition: opacity var(--transition-base);
            animation: gradientFlow 4s ease infinite;
        }

        &:hover {
            transform: translateY(-12px) rotateX(5deg) rotateY(2deg) !important;
            box-shadow: 0 20px 60px -10px var(--color-shadow-lg) !important;

            &::before {
                opacity: 1;
            }

            .p-card-content {
                text-shadow:
                    0 0 20px currentColor,
                    0 0 40px currentColor;
            }
        }

        &:active {
            transform: translateY(-8px) !important;
        }

        // Couleur spécifique par carte avec glows
        &:nth-child(1) {
            &:hover {
                box-shadow: 0 20px 60px -10px var(--glow-purple) !important;
            }

            .p-card-content {
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        }

        &:nth-child(2) {
            &:hover {
                box-shadow: 0 20px 60px -10px var(--glow-pink) !important;
            }

            .p-card-content {
                background: var(--gradient-vibrant);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        }

        &:nth-child(3) {
            &:hover {
                box-shadow: 0 20px 60px -10px var(--glow-cyan) !important;
            }

            .p-card-content {
                background: var(--gradient-neon);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        }

        &:nth-child(4) {
            &:hover {
                box-shadow: 0 20px 60px -10px var(--glow-orange) !important;
            }

            .p-card-content {
                background: var(--gradient-sunset);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        }
    }

    /* Titre des cards */
    :deep(.p-card-title) {
        color: var(--color-text-secondary) !important;
        transition: color var(--transition-base);
    }

    /* Contenu des cards (chiffres) */
    :deep(.p-card-content) {
        font-size: 3.5rem !important;
        font-weight: 700 !important;
        transition: text-shadow var(--transition-base);
        animation: numberPulse 0.6s var(--transition-bounce);

        @media (max-width: 768px) {
            font-size: 2.5rem !important;
        }
    }
}

/* Amélioration des boutons avec effets vibrants */
.oea-end-buttons :deep(.p-button) {
    position: relative;
    overflow: hidden;
    font-weight: 600;
    letter-spacing: 0.025em;
    background: var(--gradient-ocean) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    transition: all var(--transition-base);

    // Shimmer effect
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        transition: left var(--transition-slow);
    }

    &:hover {
        transform: translateY(-4px) !important;
        box-shadow:
            0 10px 30px -5px var(--glow-cyan),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset !important;

        &::before {
            left: 100%;
        }
    }

    &:active {
        transform: translateY(0) !important;
    }
}

/* Désactiver animations si préférence utilisateur */
@media (prefers-reduced-motion: reduce) {
    .oea-end-stats-container :deep(.p-card) {
        &::before {
            animation: none !important;
        }

        &:hover {
            transform: translateY(-4px) !important;
        }
    }

    .oea-end-buttons :deep(.p-button) {
        &::before {
            display: none;
        }
    }
}
</style>
