<template>
    <div class="oea-home">
        <div class="oea-home-inner">
            <header class="oea-home-head">
                <h1>{{ $t('home.title') }}</h1>
                <!-- Same "?" as in the game, on the title line where it is seen on arrival -->
                <button type="button" class="oea-home-help" @click="instructionsVisible = true">
                    <span class="oea-home-help-icon" aria-hidden="true">?</span>
                    <span class="oea-home-help-label">{{ $t('home.howToShort') }}</span>
                </button>
                <p class="oea-mono">{{ subtitle }}</p>
            </header>

            <button v-if="resume" type="button" class="oea-resume" :style="{ backgroundImage: `url(${resume.thumb})` }" @click="resumeGame">
                <span class="oea-resume-text">
                    <span class="oea-mono">{{ $t('home.resume') }}</span>
                    <b>{{ resume.label }}</b>
                </span>
                <span class="oea-resume-go" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
            </button>

            <section class="oea-home-levels">
                <h2 class="oea-home-label">
                    {{ $t('home.levels') }} <span>{{ levels.length }}</span>
                </h2>
                <ul class="oea-levels">
                    <li v-for="level in levels" :key="level.id">
                        <button type="button" class="oea-level" :class="{ 'is-done': level.done }" @click="openLevel(level.id)">
                            <img :src="level.thumb" alt="" loading="lazy" />
                            <span class="oea-level-name">
                                {{ level.name }}
                                <span class="oea-mono">{{ level.found }}/{{ level.total }}</span>
                            </span>
                            <span class="oea-level-bar" :style="{ '--p': level.percent + '%' }"></span>
                        </button>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuestsStore } from '@/stores/questsStore.js';
import { useUiStore } from '@/stores/uiStore.js';
import { formatDuration, thumbUrl } from '@/utils/utils.js';

const { t } = useI18n();
const router = useRouter();
const questsStore = useQuestsStore();
const { difficultyLevels, progress, currentQuestIndex } = storeToRefs(questsStore);
const { instructionsVisible } = storeToRefs(useUiStore());

// Each card shows its level's run, the one a tap resumes
const levels = computed(() =>
    [...difficultyLevels.value, 'all'].map((id) => {
        const photos = questsStore.getLevelPhotos(id);
        const { found, total } = questsStore.runProgress(id);
        return {
            id,
            name: t('difficulty.' + id),
            // "All" would repeat the first level's photo: take the most recent one instead
            thumb: thumbUrl(id === 'all' ? photos.at(-1) : photos[0]),
            found,
            total,
            percent: total ? (found / total) * 100 : 0,
            done: total > 0 && found === total,
        };
    }),
);

const subtitle = computed(() => {
    const total = questsStore.getTotalCount('all');
    if (!progress.value.playTime) {
        return t('home.fresh', { total });
    }
    return t('home.progress', { found: questsStore.getCompletedCount('all'), total, time: formatDuration(progress.value.playTime) });
});

// The last level played, on the photo it will open: the next one still to search
const resume = computed(() => {
    const last = progress.value.last;
    if (!last) {
        return null;
    }
    const index = questsStore.resumeIndex(last.level);
    const quest = questsStore.getLevelPhotos(last.level)[index];
    if (!quest) {
        return null;
    }
    return {
        level: last.level,
        thumb: thumbUrl(quest),
        label: t('quest.position', { level: t('difficulty.' + last.level), index: index + 1, count: questsStore.getTotalCount(last.level) }),
    };
});

// Resumes the level's run (its recap if it is complete, its first photo if never played)
function openLevel(level) {
    questsStore.openLevel(level);
    router.push({ name: 'quest', params: { difficultyLevel: level, imageIndex: currentQuestIndex.value + 1 } });
}

function resumeGame() {
    openLevel(resume.value.level);
}
</script>

<style scoped lang="scss">
.oea-home {
    flex: 1;
    overflow-y: auto;
    background: var(--paper);
    color: var(--ink);
}

.oea-home-inner {
    max-width: 60rem;
    margin: 0 auto;
    padding: calc(2.5rem + var(--safe-top)) max(1rem, env(safe-area-inset-right, 0px)) calc(2rem + var(--safe-bottom)) max(1rem, env(safe-area-inset-left, 0px));
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    @media (min-width: 720px) {
        padding-top: calc(4rem + var(--safe-top));
        gap: 2rem;
    }
}

// Title and help on the same line, the subtitle under both
.oea-home-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
        'title help'
        'sub sub';
    align-items: center;
    gap: 0.375rem 0.75rem;

    h1 {
        grid-area: title;
        font-size: clamp(2rem, 7vw, 3.5rem);
        letter-spacing: -0.04em;
    }

    p {
        grid-area: sub;
        font-size: 0.8125rem;
        color: var(--mid);
    }
}

.oea-resume {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    height: 11rem;
    padding: 1rem;
    border: 0;
    border-radius: var(--radius-card);
    overflow: hidden;
    background-size: cover;
    background-position: center;
    color: #fff;
    text-align: left;
    cursor: pointer;
    transition: transform 200ms var(--ease-out);

    @media (min-width: 720px) {
        height: 15rem;
        padding: 1.5rem;
    }

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(transparent 30%, rgba(0, 0, 0, 0.7));
    }

    &:active {
        transform: scale(0.99);
    }

    > * {
        position: relative;
    }
}

.oea-resume-text {
    display: grid;
    gap: 0.125rem;

    .oea-mono {
        font-size: 0.6875rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        opacity: 0.85;
    }

    b {
        font-size: 1.125rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }
}

.oea-resume-go {
    width: 2.5rem;
    height: 2.5rem;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #fff;
    color: #0f0f12;
    transition: transform 200ms var(--ease-out);

    svg {
        width: 1.1rem;
        height: 1.1rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
}

.oea-resume:hover .oea-resume-go {
    transform: translateX(3px);
}

.oea-home-levels {
    display: grid;
    gap: 0.75rem;
}

.oea-home-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0;

    span {
        font-weight: 400;
        color: var(--mid);
    }
}

// Every level visible at once: 3 columns, 2 rows
.oea-levels {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem 0.625rem;

    @media (min-width: 720px) {
        gap: 1.25rem 1rem;
    }
}

.oea-level {
    width: 100%;
    display: grid;
    gap: 0.4rem;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;

    img {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 14px;
        background: var(--hair);
        transition: transform 200ms var(--ease-out);

        @media (min-width: 720px) {
            aspect-ratio: 4 / 3;
        }
    }

    &:hover img {
        transform: scale(1.02);
    }

    &:active img {
        transform: scale(0.98);
    }
}

// Narrow cards: count under the name, so "Très difficile" never collides with it
.oea-level-name {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.25;

    .oea-mono {
        font-size: 0.6875rem;
        font-weight: 400;
        color: var(--mid);
    }

    @media (min-width: 720px) {
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 0.875rem;

        .oea-mono {
            font-size: 0.75rem;
        }
    }
}

.oea-level-bar {
    position: relative;
    height: 3px;
    border-radius: 3px;
    background: var(--hair);
    overflow: hidden;

    &::after {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: var(--p);
        background: var(--ink);
    }
}

.oea-level.is-done .oea-level-bar::after {
    background: var(--hot);
}

.oea-home-help {
    grid-area: help;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3125rem 0.875rem 0.3125rem 0.3125rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--surface-1);
    box-shadow: inset 0 0 0 1px var(--hair);
    color: var(--ink);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition:
        box-shadow 150ms ease,
        transform 150ms var(--ease-out);

    &:hover {
        box-shadow: inset 0 0 0 1.5px var(--mid);
    }

    &:active {
        transform: scale(0.97);
    }

    // Very narrow phones: the "?" alone, the label stays for screen readers
    @media (max-width: 379px) {
        padding: 0.3125rem;

        .oea-home-help-label {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
    }
}

.oea-home-help-icon {
    width: 1.5rem;
    height: 1.5rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--ink);
    color: var(--on-ink);
    font-weight: 700;
}
</style>
