<template>
    <Dialog v-model:visible="isVisible" modal :dismissableMask="true" class="oea-instructions-dialog" :style="{ width: isMobile ? '95vw' : '600px' }">
        <template #header>
            <div class="oea-instructions-header">
                <h1 class="oea-instructions-title">{{ $t('instructions.title') }}</h1>
                <p class="oea-instructions-subtitle">{{ $t('instructions.subtitle') }}</p>
            </div>
        </template>

        <div class="oea-instructions-content">
            <!-- Desktop Controls -->
            <div v-if="!isMobile" class="oea-controls-section animate-fadeInUp">
                <h2 class="oea-section-title">
                    <i class="pi pi-desktop"></i>
                    {{ $t('instructions.desktop.title') }}
                </h2>

                <div class="oea-instruction-item" style="animation-delay: 0.1s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-search-plus"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.zoom.label') }}</strong>
                        <p>{{ $t('instructions.desktop.zoom.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item" style="animation-delay: 0.2s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-arrows-alt"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.pan.label') }}</strong>
                        <p>{{ $t('instructions.desktop.pan.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item" style="animation-delay: 0.3s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-map-marker"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.click.label') }}</strong>
                        <p>{{ $t('instructions.desktop.click.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item" style="animation-delay: 0.4s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-arrow-right-arrow-left"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.keyboard.label') }}</strong>
                        <p>{{ $t('instructions.desktop.keyboard.description') }}</p>
                    </div>
                </div>
            </div>

            <!-- Mobile Controls -->
            <div v-else class="oea-controls-section animate-fadeInUp">
                <h2 class="oea-section-title">
                    <i class="pi pi-mobile"></i>
                    {{ $t('instructions.mobile.title') }}
                </h2>

                <div class="oea-instruction-item" style="animation-delay: 0.1s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-search-plus"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.mobile.pinch.label') }}</strong>
                        <p>{{ $t('instructions.mobile.pinch.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item" style="animation-delay: 0.2s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-arrows-alt"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.mobile.pan.label') }}</strong>
                        <p>{{ $t('instructions.mobile.pan.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item" style="animation-delay: 0.3s">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-map-marker"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.mobile.tap.label') }}</strong>
                        <p>{{ $t('instructions.mobile.tap.description') }}</p>
                    </div>
                </div>
            </div>

            <!-- Tips Section -->
            <div class="oea-tips-section animate-fadeInUp" style="animation-delay: 0.5s">
                <h3 class="oea-tips-title">
                    <i class="pi pi-lightbulb"></i>
                    {{ $t('instructions.tips.title') }}
                </h3>
                <ul class="oea-tips-list">
                    <li>{{ $t('instructions.tips.clue') }}</li>
                    <li>{{ $t('instructions.tips.difficulty') }}</li>
                </ul>
            </div>
        </div>

        <template #footer>
            <Button class="oea-got-it-button" :label="$t('instructions.gotIt')" @click="closeDialog" outlined raised severity="contrast"></Button>
        </template>
    </Dialog>
</template>

<script setup>
import { computed } from 'vue';
import useDeviceDetection from '@/composables/useDeviceDetection.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:visible']);

const { isMobile } = useDeviceDetection();

const isVisible = computed({
    get() {
        return props.visible;
    },
    set(value) {
        emit('update:visible', value);
    },
});

function closeDialog() {
    isVisible.value = false;
}
</script>

<style lang="scss">
.oea-instructions-dialog {
    &.p-dialog {
        background: rgba(26, 31, 58, 0.95) !important;
        backdrop-filter: blur(20px) saturate(180%);
        border: 2px solid transparent;
        border-radius: var(--radius-lg);
        background-clip: padding-box;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: var(--radius-lg);
            padding: 2px;
            background: linear-gradient(135deg, var(--color-purple), var(--color-pink), var(--color-cyan));
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: exclude;
            mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
            z-index: -1;
        }
    }

    :deep(.p-dialog-header) {
        padding: 2rem 2rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: transparent;
    }

    :deep(.p-dialog-content) {
        padding: 2rem;
        color: var(--color-text-primary);
        background: transparent;
    }

    :deep(.p-dialog-footer) {
        padding: 1rem 2rem 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: transparent;
    }

    @media screen and (max-device-width: 768px) {
        :deep(.p-dialog-header),
        :deep(.p-dialog-content),
        :deep(.p-dialog-footer) {
            padding: 1.5rem;
        }
    }
}

.oea-instructions-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    background: var(--gradient-vibrant);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 0.5rem;
}

.oea-instructions-subtitle {
    font-size: clamp(0.95rem, 2vw, 1.1rem);
    color: var(--color-text-primary);
    font-weight: bold;
    margin: 0;
}

.oea-instructions-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.oea-controls-section {
    animation: fadeInUp 0.6s ease-out;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.oea-section-title {
    font-size: clamp(1.25rem, 3vw, 1.5rem);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
        color: var(--color-purple);
        font-size: 1.5rem;
    }
}

.oea-instruction-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-md);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all var(--transition-base);
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;

    &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateX(4px);
    }

    @media screen and (max-device-width: 768px) {
        padding: 1rem;
        gap: 1rem;
    }
}

.oea-instruction-icon {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-purple), var(--color-pink));
    border-radius: var(--radius-sm);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

    i {
        font-size: 1.5rem;
        color: white;
    }

    @media screen and (max-device-width: 768px) {
        width: 2.5rem;
        height: 2.5rem;

        i {
            font-size: 1.25rem;
        }
    }
}

.oea-instruction-text {
    flex: 1;

    strong {
        display: block;
        font-size: clamp(1rem, 2vw, 1.125rem);
        color: var(--color-text-primary);
        margin-bottom: 0.25rem;
    }

    p {
        font-size: clamp(0.875rem, 2vw, 0.95rem);
        color: var(--color-text-secondary);
        margin: 0;
        line-height: 1.5;
    }
}

.oea-tips-section {
    padding: 1.5rem;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
    border-radius: var(--radius-md);
    border: 1px solid rgba(139, 92, 246, 0.2);
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;
}

.oea-tips-title {
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
        color: var(--color-cyan);
        font-size: 1.25rem;
    }
}

.oea-tips-list {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--color-text-secondary);

    li {
        font-size: clamp(0.875rem, 2vw, 0.95rem);
        margin-bottom: 0.5rem;
        line-height: 1.6;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

.oea-got-it-button {
    position: relative;
    font-size: 1.25rem !important;
    padding: 0.5rem !important;
    width: 100%;
    background: var(--gradient-primary) !important;
    border: 1px solid rgba(var(--white-rgb), 0.1) !important;
    color: white !important;
    font-weight: 600;
    letter-spacing: 0.05em;
    overflow: hidden;
    box-shadow:
        0 10px 40px -10px var(--glow-purple),
        0 0 0 1px rgba(var(--white-rgb), 0.1) inset !important;
    transition: all var(--transition-base) !important;
    animation: fadeInUp 0.6s var(--transition-bounce);

    // Shimmer overlay
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
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
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .oea-instruction-item,
    .oea-controls-section,
    .oea-tips-section {
        animation: none;
    }

    .oea-instruction-item:hover,
    .oea-got-it-button:hover {
        transform: none;
    }
}
</style>
