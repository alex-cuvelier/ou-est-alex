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
            <div v-if="!isMobile" class="oea-controls-section">
                <h2 class="oea-section-title">
                    <i class="pi pi-desktop"></i>
                    {{ $t('instructions.desktop.title') }}
                </h2>

                <div class="oea-instruction-item">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-search-plus"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.zoom.label') }}</strong>
                        <p>{{ $t('instructions.desktop.zoom.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-arrows-alt"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.pan.label') }}</strong>
                        <p>{{ $t('instructions.desktop.pan.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-map-marker"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.desktop.click.label') }}</strong>
                        <p>{{ $t('instructions.desktop.click.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item">
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
            <div v-else class="oea-controls-section">
                <h2 class="oea-section-title">
                    <i class="pi pi-mobile"></i>
                    {{ $t('instructions.mobile.title') }}
                </h2>

                <div class="oea-instruction-item">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-search-plus"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.mobile.pinch.label') }}</strong>
                        <p>{{ $t('instructions.mobile.pinch.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item">
                    <div class="oea-instruction-icon">
                        <i class="pi pi-arrows-alt"></i>
                    </div>
                    <div class="oea-instruction-text">
                        <strong>{{ $t('instructions.mobile.pan.label') }}</strong>
                        <p>{{ $t('instructions.mobile.pan.description') }}</p>
                    </div>
                </div>

                <div class="oea-instruction-item">
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
            <div class="oea-tips-section">
                <h3 class="oea-tips-title">
                    {{ $t('instructions.tips.title') }}
                </h3>
                <ul class="oea-tips-list">
                    <li>
                        {{ $t('instructions.tips.cluePrefix') }}
                        <span class="oea-clue-button-demo">
                            <img src="@/assets/icons/compass-solid.svg" />
                        </span>
                        {{ $t('instructions.tips.clueSuffix') }}
                    </li>
                    <li>{{ $t('instructions.tips.difficulty') }}</li>
                </ul>
            </div>
        </div>

        <template #footer>
            <button type="button" class="oea-button oea-got-it-button" @click="closeDialog">{{ $t('instructions.gotIt') }}</button>
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
.oea-instructions-dialog.p-dialog {
    max-height: 90svh;
    border: 0;
    border-radius: 1.5rem;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.55);

    .p-dialog-header {
        align-items: flex-start;
        padding: 1.5rem 1.5rem 0.75rem;
        background: transparent;
        color: var(--ink);
    }

    .p-dialog-content {
        padding: 0 1.5rem;
        background: transparent;
        color: var(--ink);
    }

    .p-dialog-footer {
        padding: 1rem 1.5rem 1.5rem;
        background: transparent;
    }

    .p-dialog-close-button {
        color: var(--mid);
    }

    @media (max-width: 768px) {
        .p-dialog-header,
        .p-dialog-content,
        .p-dialog-footer {
            padding-inline: 1.25rem;
        }
    }
}

.oea-instructions-title {
    margin: 0 0 0.25rem;
    font-size: clamp(1.5rem, 4vw, 2rem);
    letter-spacing: -0.035em;
}

.oea-instructions-subtitle {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--mid);
}

.oea-instructions-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.oea-controls-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.oea-section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mid);

    i {
        font-size: 0.875rem;
    }
}

.oea-instruction-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--hair);

    &:last-child {
        border-bottom: 0;
    }
}

.oea-instruction-icon {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--ink);
    color: var(--on-ink);

    i {
        font-size: 1.1rem;
    }
}

.oea-instruction-text {
    flex: 1;

    strong {
        display: block;
        font-size: 0.9375rem;
        font-weight: 600;
    }

    p {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.45;
        color: var(--mid);
    }
}

.oea-tips-section {
    padding: 1rem 1.125rem;
    border-radius: 14px;
    background: var(--surface-1);
    box-shadow: inset 0 0 0 1px var(--hair);
}

.oea-tips-title {
    margin: 0 0 0.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.oea-tips-list {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--mid);

    li {
        font-size: 0.875rem;
        line-height: 1.6;
    }
}

.oea-clue-button-demo {
    display: inline-grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    margin: 0 0.2rem;
    vertical-align: middle;
    border-radius: 50%;
    background: var(--hot);

    img {
        width: 1rem;
        height: 1rem;
        filter: brightness(0) invert(1);
    }
}

.oea-got-it-button {
    width: 100%;
}
</style>
