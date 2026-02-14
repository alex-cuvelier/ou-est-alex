<template>
    <div class="oea-level-chooser">
        <!-- Blobs flottants en arrière-plan -->
        <div class="oea-blob oea-blob-1"></div>
        <div class="oea-blob oea-blob-2"></div>
        <div class="oea-blob oea-blob-3"></div>

        <h1>{{ $t('level-chooser.title') }}</h1>
        <div class="oea-levels-container">
            <Button v-for="level in [...difficultyLevels, 'all']" :key="level" outlined raised severity="contrast" @click="setLevel(level)">
                {{ $t('difficulty.' + level) }}
                <!-- {{ questsStore.getCompletedCount(level) }} / {{  questsStore.getTotalCount(level) }} -->
            </Button>
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
.oea-level-chooser {
    padding: 2rem;
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background: var(--bg-primary);

    // Pattern géométrique subtil en arrière-plan
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(var(--color-purple-rgb), 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--color-purple-rgb), 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
        mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
    }

    // Blobs SVG flottants
    .oea-blob {
        position: absolute;
        opacity: 0.3;
        filter: blur(40px);
        pointer-events: none;
        z-index: 0;

        &.oea-blob-1 {
            width: 400px;
            height: 400px;
            top: -100px;
            left: -100px;
            background: var(--gradient-vibrant);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            animation: float 20s ease-in-out infinite, morph 8s ease-in-out infinite;
        }

        &.oea-blob-2 {
            width: 350px;
            height: 350px;
            top: 50%;
            right: -80px;
            background: var(--gradient-neon);
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            animation: floatReverse 25s ease-in-out infinite, morph 10s ease-in-out infinite 2s;
        }

        &.oea-blob-3 {
            width: 300px;
            height: 300px;
            bottom: -80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--gradient-fire);
            border-radius: 40% 60% 60% 40% / 40% 50% 60% 50%;
            animation: float 30s ease-in-out infinite, morph 12s ease-in-out infinite 4s;
        }

        // Mobile : animations plus lentes
        @media (max-device-width: 768px) {
            &.oea-blob-1 { animation-duration: 30s, 12s; }
            &.oea-blob-2 { animation-duration: 35s, 14s; }
            &.oea-blob-3 { animation-duration: 40s, 16s; }
        }
    }

    h1 {
        position: relative;
        z-index: 1;
        text-align: center;
        margin-bottom: 3rem;
        font-size: clamp(2.5rem, 6vw, 4rem);
        font-weight: 800;
        background: var(--gradient-vibrant);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: fadeInUp 0.6s var(--transition-bounce);

        // Glow line sous le titre
        &::after {
            content: '';
            position: absolute;
            bottom: -1rem;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: var(--gradient-vibrant);
            border-radius: 2px;
            box-shadow:
                0 0 20px var(--glow-pink),
                0 0 40px var(--glow-pink);
        }
    }

    .oea-levels-container {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1.5rem;
        align-items: center;

        :deep(.p-button) {
            position: relative;
            font-size: 1.25rem !important;
            padding: 1.5rem 3rem !important;
            min-width: 20rem;
            background: var(--gradient-primary) !important;
            border: 1px solid rgba(var(--white-rgb), 0.1) !important;
            color: white !important;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            overflow: hidden;
            box-shadow:
                0 10px 40px -10px var(--glow-purple),
                0 0 0 1px rgba(var(--white-rgb), 0.1) inset !important;
            transition: all var(--transition-base) !important;
            animation: fadeInUp 0.6s var(--transition-bounce);

            // Échelonnement de l'animation d'entrée
            &:nth-child(1) { animation-delay: 0.1s; opacity: 0; animation-fill-mode: forwards; }
            &:nth-child(2) { animation-delay: 0.2s; opacity: 0; animation-fill-mode: forwards; }
            &:nth-child(3) { animation-delay: 0.3s; opacity: 0; animation-fill-mode: forwards; }
            &:nth-child(4) { animation-delay: 0.4s; opacity: 0; animation-fill-mode: forwards; }
            &:nth-child(5) { animation-delay: 0.5s; opacity: 0; animation-fill-mode: forwards; }

            // Shimmer overlay
            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.3) 50%,
                    transparent 100%
                );
                transition: left var(--transition-slow);
            }

            &:hover {
                transform: translateY(-8px) scale(1.02) !important;
                box-shadow:
                    0 20px 60px -10px var(--glow-purple),
                    0 0 40px var(--glow-pink),
                    0 0 0 1px rgba(var(--white-rgb), 0.2) inset !important;

                &::before {
                    left: 100%;
                }
            }

            &:active {
                transform: translateY(-4px) scale(1) !important;
            }

            // Mobile : réduire les effets
            @media (max-device-width: 768px) {
                padding: 1.25rem 2.5rem !important;
                min-width: 18rem;

                &:hover {
                    transform: translateY(-4px) scale(1.01) !important;
                }
            }
        }
    }

    // Désactiver animations si préférence utilisateur
    @media (prefers-reduced-motion: reduce) {
        .oea-blob {
            animation: none !important;
        }

        h1 {
            animation: fadeIn 0.3s ease-in-out !important;
        }

        :deep(.p-button) {
            animation: fadeIn 0.3s ease-in-out !important;

            &::before {
                display: none;
            }
        }
    }
}
</style>