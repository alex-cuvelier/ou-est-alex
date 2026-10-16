<template>
    <section class="oea-recap">
        <header class="oea-recap-head">
            <p class="oea-recap-kicker oea-mono">{{ $t(isRunComplete ? 'end.done' : 'end.inProgress', { level: levelName }) }}</p>
            <h1>{{ $t('end.found', { found: runSummary.found, count: runSummary.count }) }}</h1>
            <dl class="oea-recap-stats">
                <div>
                    <dt>{{ $t('end.statTime') }}</dt>
                    <dd>{{ formatClock(runSummary.time) }}</dd>
                </div>
                <div>
                    <dt>{{ $t('end.statClues') }}</dt>
                    <dd>{{ runSummary.clueCount }}</dd>
                </div>
                <div>
                    <dt>{{ $t('end.statNos') }}</dt>
                    <dd>{{ runSummary.noCount }}</dd>
                </div>
            </dl>
        </header>

        <ol class="oea-mosaic">
            <li v-for="tile in tiles" :key="tile.quest.id">
                <button
                    v-tooltip.top="tooltip(tile.ariaLabel)"
                    type="button"
                    class="oea-mosaic-tile"
                    :class="'is-' + tile.status"
                    :style="tile.style"
                    :aria-label="tile.ariaLabel"
                    @click="questsStore.setCurrentQuestIndex(tile.index)"
                >
                    <span
                        v-if="tile.status === 'found'"
                        class="oea-mosaic-ring"
                        :style="{ left: tile.alex.x + '%', top: tile.alex.y + '%' }"
                        aria-hidden="true"
                    ></span>
                    <span class="oea-mosaic-label oea-mono">{{ tile.label }}</span>
                </button>
            </li>
        </ol>

        <!-- A score to share only once the level is complete -->
        <div v-if="isRunComplete" class="oea-share">
            <pre ref="shareBlock" class="oea-mono">{{ shareText }}</pre>
            <button type="button" class="oea-button" @click="copyShareText">{{ copied ? $t('end.copied') : $t('end.copy') }}</button>
        </div>

        <!-- Back on the left, forward on the right: the main action comes last (full width at the bottom on phones) -->
        <div class="oea-recap-actions">
            <RouterLink class="oea-button oea-button--ghost" :to="{ name: 'levelChooser' }">{{ $t('end.home') }}</RouterLink>
            <button type="button" class="oea-button oea-button--ghost" @click="questsStore.restartLevel">
                {{ isRunComplete ? $t('end.restart') : $t('end.startOver') }}
            </button>
            <button v-if="!isRunComplete" type="button" class="oea-button" @click="continueRun">
                {{ $t('end.continue', runSummary.count - runSummary.found) }}
            </button>
            <button v-else-if="hasNextLevel" type="button" class="oea-button" @click="goToNextDifficultyLevel">{{ $t('end.next') }}</button>
        </div>
    </section>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuestsStore } from '@/stores/questsStore.js';
import { alexPosition, formatClock, thumbUrl } from '@/utils/utils.js';
import { tooltip } from '@/utils/tooltip.js';
import confetti from '@/composables/useConfetti';

const { t } = useI18n();

const questsStore = useQuestsStore();
const { runSummary, runStats, isRunComplete, levelPhotos, difficultyLevels, currentDifficultyLevel } = storeToRefs(questsStore);

const levelName = computed(() => t('difficulty.' + currentDifficultyLevel.value));

const tiles = computed(() =>
    levelPhotos.value.map((quest, index) => {
        const status = questsStore.questStatus(quest.id);
        const alex = alexPosition(quest);
        const label = status === 'found' ? formatClock(runStats.value[quest.id].time) : t(status === 'missed' ? 'end.missed' : 'end.todo');
        return {
            quest,
            index,
            status,
            alex,
            label,
            ariaLabel: t('end.open', { index: index + 1, status: label }),
            // Background positioned on Alex: the ring lands on him whatever the crop
            style: { backgroundImage: `url(${thumbUrl(quest)})`, backgroundPosition: `${alex.x}% ${alex.y}%` },
        };
    }),
);

const hasNextLevel = computed(() => typeof currentDifficultyLevel.value === 'number' && difficultyLevels.value.includes(currentDifficultyLevel.value + 1));

const shareText = computed(() =>
    [
        t('end.shareTitle', { level: levelName.value }),
        `${runSummary.value.found}/${runSummary.value.count} · ${formatClock(runSummary.value.time)} · ${t('quest.clues', runSummary.value.clueCount)}`,
        'ouestalex.fr',
    ].join('\n'),
);

const copied = ref(false);
const shareBlock = ref(null);

async function copyShareText() {
    try {
        await navigator.clipboard.writeText(shareText.value);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch {
        // Clipboard refused: select the text so it can be copied by hand
        const range = document.createRange();
        range.selectNodeContents(shareBlock.value);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
}

// The first photo still to search
function continueRun() {
    questsStore.setCurrentQuestIndex(questsStore.nextToSearchIndex(0));
}

// Opens where its run is: its recap if it was already completed
function goToNextDifficultyLevel() {
    questsStore.openLevel(currentDifficultyLevel.value + 1);
}

// Everything found: heads shot from both bottom corners
onMounted(() => {
    if (isRunComplete.value) {
        confetti.celebrate();
    }
});

onUnmounted(() => {
    confetti.clear();
});
</script>

<style scoped lang="scss">
.oea-recap {
    max-width: 44rem;
    margin: 0 auto;
    padding: calc(2rem + var(--safe-top)) max(1rem, env(safe-area-inset-right, 0px)) calc(2rem + var(--safe-bottom)) max(1rem, env(safe-area-inset-left, 0px));
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.oea-recap-head {
    display: grid;
    gap: 0.375rem;

    h1 {
        font-size: clamp(1.75rem, 6vw, 2.5rem);
    }
}

// Time, clues and misses: the numbers the player looks for first
.oea-recap-stats {
    margin: 0.625rem 0 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-radius: 16px;
    background: var(--surface-1);
    box-shadow: inset 0 0 0 1px var(--hair);

    div {
        display: grid;
        gap: 0.25rem;
        padding: 0.875rem 1rem;
    }

    div + div {
        border-left: 1px solid var(--hair);
    }

    dt {
        font-family: var(--font-mono);
        font-size: 0.6875rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mid);
    }

    dd {
        margin: 0;
        font-size: clamp(1.5rem, 5vw, 2rem);
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1.1;
    }
}

.oea-recap-kicker {
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mid);
}

.oea-mosaic {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.25rem, 1fr));
    gap: 0.375rem;
}

.oea-mosaic-tile {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 10px;
    overflow: hidden;
    background-color: var(--hair);
    background-size: cover;
    background-repeat: no-repeat;
    cursor: pointer;
    transition: transform 150ms var(--ease-out);

    &:active {
        transform: scale(0.97);
    }

    &.is-missed {
        filter: grayscale(1) brightness(0.7);
    }

    &.is-todo {
        opacity: 0.45;
    }
}

.oea-mosaic-ring {
    position: absolute;
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--hot);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.oea-mosaic-label {
    position: absolute;
    left: 5px;
    bottom: 5px;
    padding: 1px 5px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 0.6875rem;
}

.oea-share {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    border-radius: 14px;
    background: var(--surface-1);
    box-shadow: inset 0 0 0 1px var(--hair);

    pre {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: 0.75rem;
        line-height: 1.5;
        white-space: pre-wrap;
    }

    .oea-button {
        min-height: 2.25rem;
        padding: 0 1rem;
        font-size: 0.8125rem;
    }
}

.oea-recap-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .oea-button {
        flex: 1 1 9rem;
    }
}
</style>
