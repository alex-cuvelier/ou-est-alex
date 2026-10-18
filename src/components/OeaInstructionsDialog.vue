<template>
    <!-- The game's glass, like the dock and the found card; PrimeVue keeps the mask, focus trap and Escape -->
    <Dialog
        v-model:visible="isVisible"
        modal
        :dismissableMask="true"
        position="bottom"
        :draggable="false"
        class="oea-instructions-dialog"
        :class="{ 'oea-instructions-dialog--game': inGame }"
        aria-labelledby="oea-instructions-title"
    >
        <template #container>
            <header class="oea-instructions-dialog__head">
                <h2 id="oea-instructions-title" class="oea-instructions-dialog__title">{{ $t('instructions.title') }}</h2>
                <p class="oea-instructions-dialog__subtitle">{{ $t('instructions.subtitle') }}</p>
            </header>

            <ul class="oea-instructions-dialog__list">
                <li v-for="row in rows" :key="row.key" class="oea-instructions-dialog__item">
                    <span class="oea-instructions-dialog__icon" aria-hidden="true">
                        <img v-if="row.icon === 'clue'" src="@/assets/icons/compass-solid.svg" alt="" />
                        <svg v-else viewBox="0 0 24 24">
                            <template v-if="row.icon === 'zoom'">
                                <circle cx="11" cy="11" r="6.5" />
                                <path d="M16 16l4 4M11 8.5v5M8.5 11h5" />
                            </template>
                            <path
                                v-else-if="row.icon === 'pan'"
                                d="M12 4v16M4 12h16M9.5 6.5L12 4l2.5 2.5M9.5 17.5L12 20l2.5-2.5M6.5 9.5L4 12l2.5 2.5M17.5 9.5L20 12l-2.5 2.5"
                            />
                            <!-- The ring drawn around Alex once found -->
                            <template v-else-if="row.icon === 'find'">
                                <circle class="oea-instructions-dialog__halo" cx="12" cy="12" r="7.5" />
                                <circle class="oea-instructions-dialog__ring" cx="12" cy="12" r="7.5" />
                            </template>
                            <path v-else-if="row.icon === 'keys'" d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />
                            <path v-else d="M6 18v-3M12 18v-7M18 18V6" stroke-width="2.6" />
                        </svg>
                    </span>
                    <span class="oea-instructions-dialog__text">
                        <b>{{ $t(`instructions.${row.key}.label`) }}</b>
                        <span>{{ $t(`instructions.${row.key}.description`) }}</span>
                    </span>
                </li>
            </ul>

            <button type="button" class="oea-instructions-dialog__button" autofocus @click="closeDialog">
                {{ $t('instructions.gotIt') }}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
        </template>
    </Dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import useDeviceDetection from '@/composables/useDeviceDetection.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:visible']);

const { isMobile } = useDeviceDetection();
const route = useRoute();

const isVisible = computed({
    get() {
        return props.visible;
    },
    set(value) {
        emit('update:visible', value);
    },
});

// In the game the panel sits above the dock, elsewhere at the bottom of the screen
const inGame = computed(() => route.name === 'quest');

// The controls of the device in use, then the tips
const rows = computed(() => {
    const controls = isMobile.value
        ? [
              { icon: 'zoom', key: 'mobile.pinch' },
              { icon: 'pan', key: 'mobile.pan' },
              { icon: 'find', key: 'mobile.tap' },
          ]
        : [
              { icon: 'zoom', key: 'desktop.zoom' },
              { icon: 'pan', key: 'desktop.pan' },
              { icon: 'find', key: 'desktop.click' },
              { icon: 'keys', key: 'desktop.keyboard' },
          ];
    return [...controls, { icon: 'clue', key: 'tips.clue' }, { icon: 'levels', key: 'tips.levels' }];
});

function closeDialog() {
    isVisible.value = false;
}
</script>

<style lang="scss">
// Qualified by the mask: PrimeVue's position rules (.p-dialog-bottom .p-dialog) are injected after this sheet
.p-dialog-mask .oea-instructions-dialog.p-dialog {
    width: min(calc(100% - 1.5rem), 24rem);
    max-height: calc(100% - 1.5rem - var(--safe-top) - var(--safe-bottom));
    margin: 0 0 calc(0.75rem + var(--safe-bottom));
    padding: 1.125rem 1rem 1rem;
    border: 0;
    border-radius: 1.25rem;
    background: var(--glass-strong);
    color: var(--on-glass);
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    box-shadow:
        inset 0 0 0 1px var(--glass-line),
        0 12px 32px -12px rgba(0, 0, 0, 0.55);

    // Same entrance as the found card, instead of a slide from the bottom edge
    &.p-dialog-enter-active {
        transition:
            opacity 200ms ease,
            transform 200ms var(--ease-out);
    }

    &.p-dialog-leave-active {
        transition: opacity 120ms ease;
    }

    &.p-dialog-enter-from {
        opacity: 0;
        transform: translate3d(0, 0.5rem, 0);
    }

    &.p-dialog-leave-to {
        opacity: 0;
        transform: none;
    }
}

// Where the found card shows: the dock stays in sight under the mask
.p-dialog-mask .oea-instructions-dialog--game.p-dialog {
    max-height: calc(100% - 6.125rem - var(--safe-top) - var(--safe-bottom));
    margin-bottom: calc(0.875rem + 3.75rem + 0.5rem + var(--safe-bottom));
}

.oea-instructions-dialog__head {
    flex-shrink: 0;
    display: grid;
    gap: 0.125rem;
    padding: 0 0.125rem 0.5rem;
}

.oea-instructions-dialog__title {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.2;
}

.oea-instructions-dialog__subtitle {
    margin: 0;
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.72);
}

// Scrolls on its own on short screens: the title and the button stay in sight
.oea-instructions-dialog__list {
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
}

.oea-instructions-dialog__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.125rem;

    & + & {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
}

// Round like the dock's arrows
.oea-instructions-dialog__icon {
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);

    svg {
        width: 1.1rem;
        height: 1.1rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    img {
        width: 1.2rem;
        height: 1.2rem;
        filter: brightness(0) invert(1);
    }
}

.oea-instructions-dialog__halo {
    stroke: rgba(255, 255, 255, 0.85);
    stroke-width: 4.5;
}

.oea-instructions-dialog__ring {
    stroke: var(--hot);
    stroke-width: 2.6;
}

.oea-instructions-dialog__text {
    flex: 1;
    min-width: 0;
    display: grid;

    b {
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1.3;
    }

    span {
        font-size: 0.8125rem;
        line-height: 1.35;
        color: rgba(255, 255, 255, 0.7);
    }
}

// White on glass, like the found card's "Next"
.oea-instructions-dialog__button {
    flex-shrink: 0;
    margin-top: 0.625rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    height: 2.75rem;
    padding: 0 1rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: #fff;
    color: #0f0f12;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 150ms var(--ease-out);

    &:active {
        transform: scale(0.97);
    }

    svg {
        width: 1rem;
        height: 1rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
}
</style>
