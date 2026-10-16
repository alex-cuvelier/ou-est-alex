<template>
    <header class="oea-header">
        <RouterLink :to="{ name: 'levelChooser' }">Où est Alex ?</RouterLink>
    </header>
</template>

<style scoped lang="scss">
.oea-header {
    display: flex;
    align-items: center;
    padding: calc(1rem + var(--safe-top)) 1.5rem 1rem;
    background: var(--color-background);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    a {
        color: var(--color-text-primary);
        font-weight: 700;
        font-size: 1.25rem;
        letter-spacing: -0.03em;
        text-decoration: none;
    }
}
</style>
