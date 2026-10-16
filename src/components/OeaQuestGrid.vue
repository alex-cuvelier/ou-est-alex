<template>
    <Drawer v-model:visible="isVisible" position="bottom" :header="$t('grid.title')" class="oea-grid-drawer" style="height: auto">
        <ol class="oea-grid">
            <li v-for="tile in tiles" :key="tile.quest.id">
                <button
                    v-tooltip.top="tooltip($t('grid.tile', { index: tile.index + 1, status: $t('grid.' + tile.status) }))"
                    type="button"
                    class="oea-grid-tile"
                    :class="['is-' + tile.status, { 'is-current': tile.index === currentQuestIndex }]"
                    :aria-current="tile.index === currentQuestIndex ? 'true' : undefined"
                    :aria-label="$t('grid.tile', { index: tile.index + 1, status: $t('grid.' + tile.status) })"
                    @click="goToQuest(tile.index)"
                >
                    <img :src="thumbUrl(tile.quest)" alt="" loading="lazy" />
                    <span class="oea-grid-num oea-mono">{{ tile.index + 1 }}</span>
                    <span v-if="tile.status === 'found'" class="oea-grid-badge" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    </span>
                </button>
            </li>
        </ol>
    </Drawer>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuestsStore } from '@/stores/questsStore.js';
import { thumbUrl } from '@/utils/utils.js';
import { tooltip } from '@/utils/tooltip.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:visible']);

const questsStore = useQuestsStore();
const { levelPhotos, currentQuestIndex } = storeToRefs(questsStore);

const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
});

// A photo found in an earlier visit stays marked found; "missed" only concerns the current run
const tiles = computed(() =>
    levelPhotos.value.map((quest, index) => {
        const runStatus = questsStore.questStatus(quest.id);
        return { quest, index, status: questsStore.isEverFound(quest.id) ? 'found' : runStatus };
    }),
);

function goToQuest(index) {
    isVisible.value = false;
    questsStore.setCurrentQuestIndex(index);
}
</script>

<style lang="scss">
.oea-grid-drawer.p-drawer {
    max-height: 80svh;
    border: 0;
    border-radius: 1.5rem 1.5rem 0 0;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 -20px 60px -20px rgba(0, 0, 0, 0.5);

    .p-drawer-header {
        padding: 1.25rem 1rem 0.75rem;
    }

    .p-drawer-title {
        font-size: 1.125rem;
        font-weight: 700;
        letter-spacing: -0.02em;
    }

    .p-drawer-content {
        padding: 0 1rem calc(1rem + var(--safe-bottom));
    }
}

.oea-grid {
    max-width: 60rem;
    margin: 0 auto;
    // Room for the current tile outline: the drawer content scrolls and would clip it
    padding: 0.375rem 0 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5.25rem, 1fr));
    gap: 0.375rem;

    @media (min-width: 720px) {
        grid-template-columns: repeat(auto-fill, 7.5rem);
        justify-content: center;
    }
}

.oea-grid-tile {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 10px;
    overflow: hidden;
    background: var(--hair);
    cursor: pointer;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 200ms var(--ease-out);
    }

    &:hover img {
        transform: scale(1.04);
    }

    &.is-missed img {
        filter: grayscale(1) brightness(0.75);
    }

    &.is-current {
        outline: 2.5px solid var(--hot);
        outline-offset: 2px;
    }
}

.oea-grid-num {
    position: absolute;
    left: 6px;
    bottom: 6px;
    padding: 1px 5px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 0.6875rem;
}

.oea-grid-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 1.25rem;
    height: 1.25rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--hot);

    svg {
        width: 0.8rem;
        height: 0.8rem;
        fill: none;
        stroke: #fff;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
}
</style>
