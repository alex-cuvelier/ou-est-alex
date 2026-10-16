<template>
    <div class="oea-home">
        <div class="oea-home-inner">
            <header class="oea-home-head">
                <h1>{{ $t('home.title') }}</h1>
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
                        <button type="button" class="oea-level" :class="{ 'is-done': level.done }" @click="startLevel(level.id)">
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

            <button type="button" class="oea-home-help" @click="instructionsVisible = true">{{ $t('home.howTo') }}</button>
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
const { difficultyLevels, progress, currentDifficultyLevel } = storeToRefs(questsStore);
const { instructionsVisible } = storeToRefs(useUiStore());

const levels = computed(() =>
    [...difficultyLevels.value, 'all'].map((id) => {
        const photos = questsStore.getLevelPhotos(id);
        const found = questsStore.getCompletedCount(id);
        return {
            id,
            name: t('difficulty.' + id),
            // "All" would repeat the first level's photo: take the most recent one instead
            thumb: thumbUrl(id === 'all' ? photos.at(-1) : photos[0]),
            found,
            total: photos.length,
            percent: photos.length ? (found / photos.length) * 100 : 0,
            done: photos.length > 0 && found === photos.length,
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

const resume = computed(() => {
    const last = progress.value.last;
    const quest = last && questsStore.getLevelPhotos(last.level)[last.index];
    if (!quest) {
        return null;
    }
    return {
        ...last,
        thumb: thumbUrl(quest),
        label: t('quest.position', { level: t('difficulty.' + last.level), index: last.index + 1, count: questsStore.getTotalCount(last.level) }),
    };
});

function startLevel(level) {
    questsStore.startLevel(level);
    router.push({ name: 'quest', params: { difficultyLevel: level, imageIndex: 1 } });
}

// Keeps the current run when resuming the level being played
function resumeGame() {
    const { level, index } = resume.value;
    if (level !== currentDifficultyLevel.value) {
        questsStore.startLevel(level);
    }
    router.push({ name: 'quest', params: { difficultyLevel: level, imageIndex: index + 1 } });
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

.oea-home-head {
    display: grid;
    gap: 0.375rem;

    h1 {
        font-size: clamp(2rem, 7vw, 3.5rem);
        letter-spacing: -0.04em;
    }

    p {
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

// Mobile: one scrollable row. Wider screens: a grid.
.oea-levels {
    margin: 0 calc(-1 * max(1rem, env(safe-area-inset-right, 0px))) 0 0;
    padding: 0 1rem 0.25rem 0;
    list-style: none;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 7.5rem;
    gap: 0.625rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    li {
        scroll-snap-align: start;
    }

    @media (min-width: 720px) {
        margin: 0;
        padding: 0;
        grid-auto-flow: row;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        overflow: visible;
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

.oea-level-name {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;

    .oea-mono {
        font-size: 0.75rem;
        font-weight: 400;
        color: var(--mid);
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
    align-self: flex-start;
    padding: 0;
    border: 0;
    background: none;
    color: var(--mid);
    font-size: 0.875rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;

    &:hover {
        color: var(--ink);
    }
}
</style>
