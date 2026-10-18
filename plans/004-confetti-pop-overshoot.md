# 004 — Faire éclore les têtes avec un petit rebond

- **Status**: APPLIED (feel check à faire)
- **Commit**: f912ca0 (indépendant des plans 001 à 003 : les lignes touchées ne bougent pas avec eux, seuls leurs numéros peuvent changer)
- **Severity**: LOW
- **Category**: Physicality & origin
- **Estimated scope**: 1 fichier, ~6 lignes dans `src/composables/useConfetti.js`

## Problem

Au lancement, une tête passe de 30 % à 100 % de sa taille en 180 ms, avec une courbe qui ralentit à l'arrivée sans jamais dépasser. C'est propre, mais sage pour une fête : l'éclosion ne « claque » pas. Le jeu a un ton ludique, et c'est un moment rare (une trouvaille), donc un léger rebond est permis.

```js
/* src/composables/useConfetti.js:20 — current */
const POP = 0.18; // s, a head grows to its size when launched
```

```js
/* src/composables/useConfetti.js:41-43 — current */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
```

```js
/* src/composables/useConfetti.js:89 — current, in flight() */
        const pop = age < POP ? 0.3 + 0.7 * easeOutCubic(age / POP) : 1;
```

## Target

L'éclosion dure 260 ms et dépasse la taille finale avant de s'y poser : de 0,3 à un pic de 1,12, puis retour à 1. Courbe « back out » : `f(t) = 1 + (c1 + 1)(t − 1)³ + c1 (t − 1)²`, avec `c1 = 2.35`. Cette valeur donne exactement un pic de 1,12 pour `0.3 + 0.7 * f(t)`.

Avec les images-clés espacées de 50 ms (`STEP = 1 / 20`), l'échelle vaut : 0,300 → 0,838 → 1,076 → **1,117** → 1,059 → 1,002 → 1. Le rebond est donc bien échantillonné, sans ajouter d'images-clés.

## Repo conventions to follow

- Code et commentaires en anglais, commentaires rares, sur une ligne, qui expliquent le pourquoi. Pas de renvoi à ce plan.
- Prettier du dépôt : 4 espaces, `printWidth` 160.
- Les fonctions d'easing vivent dans la section `// --- Utilities ---` du fichier.

## Steps

1. Remplace la constante `POP` :

```js
const POP = 0.26; // s, a head grows past its size when launched, then settles
```

2. Remplace `easeOutCubic()` (utilisée uniquement dans `flight()`) par :

```js
// Overshoots to 1.17 before settling at 1: a head pops up to 1.12 of its size
function easeOutBack(t) {
    const c1 = 2.35;
    return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
```

3. Dans `flight()`, remplace la ligne du `pop` par :

```js
        const pop = age < POP ? 0.3 + 0.7 * easeOutBack(age / POP) : 1;
```

4. Vérifie qu'il ne reste aucune référence à `easeOutCubic` dans le fichier.

## Boundaries

- Ne modifie que `src/composables/useConfetti.js`. D'autres fichiers sont modifiés dans l'arbre de travail par d'autres sessions (`styles.scss`, `OeaQuestGrid.vue`, `package.json`) : n'y touche pas.
- Ne change ni `STEP`, ni le balancement (`scaleX`), ni l'opacité, ni les trajectoires.
- Aucune nouvelle dépendance. Pas de commit.
- Si les trois extraits ci-dessus ne se retrouvent pas dans le fichier (au contenu près, les numéros de ligne peuvent avoir bougé), ARRÊTE-TOI et signale-le.

## Verification

- **Mécanique** : `npx prettier --check src/composables/useConfetti.js`, `npx eslint src/composables/useConfetti.js` et `npx vitest run` passent.
- **Feel check** : l'utilisateur lance `npm run dev`. Console : `const c = (await import('/src/composables/useConfetti.js')).default; c.burst(innerWidth / 2, innerHeight / 2)`.
  - DevTools > Animations, vitesse 10 % : chaque tête grossit un peu au-delà de sa taille, puis s'y pose. Elle ne rétrécit pas une deuxième fois, il n'y a pas d'oscillation.
  - À vitesse normale : la gerbe « claque » au départ, sans paraître élastique ni molle. Si le rebond se remarque comme un effet à part, signale-le plutôt que de changer `c1` de ta propre initiative.
- **Done when** : `easeOutCubic` n'existe plus, `POP` vaut 0.26, et le pic d'échelle d'une tête est de 1,12.
