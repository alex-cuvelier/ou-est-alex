# 001 — Lancer les têtes en une seule mise en page

- **Status**: APPLIED (feel check à faire)
- **Commit**: f912ca0
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 fichier, ~40 lignes réécrites dans `src/composables/useConfetti.js`

## Problem

`launch()` ajoute chaque tête à la page puis relit la hauteur du calque. Chaque lecture de `clientHeight` après un `appendChild` force le navigateur à recalculer la mise en page tout de suite. Il y a donc un recalcul forcé par tête : 22 pour une trouvaille (`burst`), 64 pour une fin de niveau (`celebrate`). Tout ça se passe dans la tâche du clic, juste avant le départ du zoom de la photo : sur un téléphone lent, c'est autant de millisecondes volées à la première image du zoom.

```js
/* src/composables/useConfetti.js:109-132 — current */
function launch({ x, y, angle, speed, delay = 0, life = random(2.4, 3.2) }) {
    const stage = getLayer();
    const size = random(44, 72); // Height in px, the width follows the image
    const head = document.createElement('img');
    head.src = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    head.alt = '';
    head.draggable = false;
    // Hidden unless animated: before its delay is over (fill backwards), and once landed
    head.style.cssText = `position: absolute; left: 0; top: 0; height: ${size}px; transform-origin: 0 0; opacity: 0;`;
    stage.appendChild(head);

    const keyframes = flight({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, life }, stage.clientHeight);
    const animation = head.animate(keyframes, {
        duration: (keyframes.length - 1) * STEP * 1000,
        delay: delay * 1000,
        fill: 'backwards',
    });
    animation.onfinish = () => {
        head.remove();
        if (layer && !layer.childElementCount) {
            clear();
        }
    };
}
```

`burst()` (lignes 137-153) et `celebrate()` (lignes 156-172) appellent `launch()` dans une boucle.

## Target

Une fonction `volley(shots, screenHeight)` remplace `launch()`. Elle prépare toutes les têtes hors de la page, dans un `DocumentFragment`, les ajoute en un seul `appendChild`, puis démarre leurs animations. La hauteur est lue une seule fois, par l'appelant, et passée en paramètre. Résultat : une seule mise en page par salve.

Le rendu ne change pas : mêmes tailles, trajectoires, délais et durées de vie.

## Repo conventions to follow

- Code et commentaires en anglais, commentaires rares, sur une ligne, qui expliquent le pourquoi. Pas d'historique de modification ni de renvoi à ce plan dans les commentaires.
- Prettier du dépôt : 4 espaces, `printWidth` 160.
- Garder le style du fichier : sections `// --- Heads ---`, JSDoc courte au-dessus des fonctions.

## Steps

1. Dans `src/composables/useConfetti.js`, remplace toute la fonction `launch()` (lignes 109-132) par :

```js
/**
 * A volley of heads: all prepared off the page, added in one go, then started, so that
 * the page is laid out once for the whole volley and not once per head.
 */
function volley(shots, screenHeight) {
    const stage = getLayer();
    const batch = document.createDocumentFragment();
    const heads = shots.map(({ x, y, angle, speed, delay = 0, life = random(2.4, 3.2) }) => {
        const size = random(44, 72); // Height in px, the width follows the image
        const head = document.createElement('img');
        head.src = IMAGES[Math.floor(Math.random() * IMAGES.length)];
        head.alt = '';
        head.draggable = false;
        // Hidden unless animated: before its delay is over (fill backwards), and once landed
        head.style.cssText = `position: absolute; left: 0; top: 0; height: ${size}px; transform-origin: 0 0; opacity: 0;`;
        batch.appendChild(head);
        const keyframes = flight({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, life }, screenHeight);
        return { head, delay, keyframes };
    });
    stage.appendChild(batch);

    for (const { head, delay, keyframes } of heads) {
        const animation = head.animate(keyframes, {
            duration: (keyframes.length - 1) * STEP * 1000,
            delay: delay * 1000,
            fill: 'backwards',
        });
        animation.onfinish = () => {
            head.remove();
            if (layer && !layer.childElementCount) {
                clear();
            }
        };
    }
}
```

2. Remplace le corps de `burst()` (lignes 137-153) pour construire un tableau de tirs puis appeler `volley()` une fois. Le commentaire existant sur le V est conservé :

```js
/** A find: heads spring up from (x, y), in viewport coordinates */
function burst(x, y) {
    if (prefersReducedMotion()) {
        return;
    }
    const height = getLayer().clientHeight;
    const shots = [];
    for (let i = 0; i < 22; i++) {
        // A V, 30° to 75° off the vertical: the heads land aside, not on Alex while the photo zooms in on him
        const side = i % 2 ? 1 : -1;
        shots.push({ x, y, angle: -Math.PI / 2 + side * random(0.55, 1.3), speed: height * random(0.9, 1.6), delay: random(0, 0.08) });
    }
    volley(shots, height);
}
```

3. Remplace le corps de `celebrate()` (lignes 156-172) de la même façon :

```js
/** A level complete: heads shot from both bottom corners towards the middle, in two waves */
function celebrate() {
    if (prefersReducedMotion()) {
        return;
    }
    const { clientWidth: width, clientHeight: height } = getLayer();
    const shots = [];
    for (const wave of [0, 0.45]) {
        for (let i = 0; i < 16; i++) {
            // From the vertical, towards the middle: up to 90% of the screen height, the two jets cross
            const tilt = random(0.25, 0.85);
            const speed = height * random(2.6, 3.4);
            const delay = wave + random(0, 0.12);
            const life = random(3, 3.6);
            shots.push(
                { x: -10, y: height + 10, angle: -Math.PI / 2 + tilt, speed, delay, life },
                { x: width + 10, y: height + 10, angle: -Math.PI / 2 - tilt, speed, delay, life },
            );
        }
    }
    volley(shots, height);
}
```

4. Vérifie qu'il ne reste aucune référence à `launch` dans le fichier.

## Boundaries

- Ne modifie que `src/composables/useConfetti.js`. D'autres fichiers sont modifiés dans l'arbre de travail par d'autres sessions (`styles.scss`, `OeaQuestGrid.vue`, `package.json`) : n'y touche pas.
- Ne change ni `flight()`, ni les constantes (`GRAVITY`, `DRAG`, `POP`, `FADE`, `STEP`), ni l'API publique `{ burst, celebrate, clear }`.
- Aucune nouvelle dépendance. Pas de commit.
- Si le code trouvé ne correspond pas aux extraits ci-dessus (dérive depuis f912ca0), ARRÊTE-TOI et signale-le au lieu d'improviser.

## Verification

- **Mécanique** : `npx prettier --check src/composables/useConfetti.js` et `npx eslint src/composables/useConfetti.js` passent sans erreur, `npx vitest run` passe.
- **Feel check** : l'utilisateur lance `npm run dev` (ne le lance pas toi-même). Dans la console des DevTools :
  ```js
  const c = (await import('/src/composables/useConfetti.js')).default
  c.burst(innerWidth / 2, innerHeight / 2)
  c.celebrate()
  ```
  - La gerbe et les deux canons sont identiques à avant : même hauteur, même V, deux salves.
  - DevTools > Performance, CPU 4× slowdown, enregistrer un `c.burst(...)` : dans la tâche, un seul bloc « Layout » au plus, et plus aucun avertissement « Forced reflow » répété 22 fois.
- **Done when** : `launch` n'existe plus, `volley` fait un seul `stage.appendChild`, et aucune lecture de `clientHeight` ou `clientWidth` n'a lieu dans `volley()`.
