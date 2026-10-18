# 002 — Fin de niveau : salves créées à leur tour, après l'affichage du récap

- **Status**: APPLIED (feel check à faire)
- **Commit**: f912ca0, **plan 001 appliqué** (prérequis)
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 fichier, ~50 lignes dans `src/composables/useConfetti.js`

## Problem

`celebrate()` est appelée au montage de l'écran de récap (`src/components/OeaEndStats.vue:137-141`, `onMounted`). Elle crée d'un coup les 64 têtes des deux salves, avec environ 4 500 étapes d'animation, dans la même tâche que le premier rendu du récap et de sa mosaïque (jusqu'à 47 vignettes). La 2e salve n'est qu'un `delay` de 0,45 s : ses 32 têtes existent dès le départ.

Résultat possible sur téléphone : une première image du récap en retard, puis des canons qui démarrent par à-coup.

Il y a aussi un piège pour la suite : quand le calque se vide, `volley()` appelle `clear()`. Si `clear()` annule désormais les salves en attente, une tête de la dernière trouvaille qui finit son vol pendant ce temps annulerait la fête. C'est probable, parce que le récap s'ouvre 2,8 s après la trouvaille et que les têtes vivent jusqu'à 3,2 s. Il faut donc séparer « le calque est vide, on le retire » de « tout arrêter ».

```js
/* src/composables/useConfetti.js — current, after plan 001 */
let layer = null;

function clear() {
    if (!layer) {
        return;
    }
    for (const animation of layer.getAnimations({ subtree: true })) {
        animation.cancel();
    }
    layer.remove();
    layer = null;
}

// in volley():
        animation.onfinish = () => {
            head.remove();
            if (layer && !layer.childElementCount) {
                clear();
            }
        };

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

## Target

- `celebrate()` attend que le récap soit peint, puis lance la 1re salve. La 2e salve est créée 450 ms après la 1re, seulement à ce moment-là.
- Technique : un `requestAnimationFrame` dont le callback programme des `setTimeout`. Un timer posé depuis un callback de frame se déclenche juste après la peinture de cette frame. Délai ajouté : une image (~16 ms), imperceptible.
- `clear()` (public) annule aussi la frame et les timers en attente.
- Quand le calque se vide en fin de vol, on le retire sans rien annuler : nouvelle fonction interne `dropLayerIfEmpty()`.
- Rendu inchangé : 16 tirs par coin et par salve, mêmes angles, vitesses, durées de vie, et le même `random(0, 0.12)` de délai par tête dans chaque salve.

## Repo conventions to follow

- Code et commentaires en anglais, commentaires rares, sur une ligne, qui expliquent le pourquoi. Pas de renvoi à ce plan.
- Prettier du dépôt : 4 espaces, `printWidth` 160.
- Le fichier gère déjà ce genre d'état en variables de module (`let layer = null;`) : même style.
- Exemple du même schéma timer + annulation dans le dépôt : `src/composables/useImageZoom.js`, `stopZoom()` (`cancelAnimationFrame(zoomFrame); clearTimeout(zoomTimeout);`).

## Steps

1. Sous `let layer = null;`, ajoute :

```js
let frame = 0; // requestAnimationFrame of a celebrate() waiting for the recap to be painted
const timers = new Set(); // Waves of a celebrate() still to fire
```

2. Remplace `clear()` par ces deux fonctions :

```js
// Once the last head has landed: nothing left to cancel, and a wave still to fire must keep its timer
function dropLayerIfEmpty() {
    if (layer && !layer.childElementCount) {
        layer.remove();
        layer = null;
    }
}

function clear() {
    cancelAnimationFrame(frame);
    for (const timer of timers) {
        clearTimeout(timer);
    }
    timers.clear();
    if (!layer) {
        return;
    }
    for (const animation of layer.getAnimations({ subtree: true })) {
        animation.cancel();
    }
    layer.remove();
    layer = null;
}
```

3. Dans `volley()`, remplace le `onfinish` par :

```js
        animation.onfinish = () => {
            head.remove();
            dropLayerIfEmpty();
        };
```

4. Remplace `celebrate()` par ces trois fonctions, à la même place, sous `burst()` :

```js
/** One wave of a level complete: heads shot from both bottom corners towards the middle */
function cannons() {
    const { clientWidth: width, clientHeight: height } = getLayer();
    const shots = [];
    for (let i = 0; i < 16; i++) {
        // From the vertical, towards the middle: up to 90% of the screen height, the two jets cross
        const tilt = random(0.25, 0.85);
        const speed = height * random(2.6, 3.4);
        const delay = random(0, 0.12);
        const life = random(3, 3.6);
        shots.push(
            { x: -10, y: height + 10, angle: -Math.PI / 2 + tilt, speed, delay, life },
            { x: width + 10, y: height + 10, angle: -Math.PI / 2 - tilt, speed, delay, life },
        );
    }
    volley(shots, height);
}

function after(ms, fire) {
    const timer = setTimeout(() => {
        timers.delete(timer);
        fire();
    }, ms);
    timers.add(timer);
}

/** A level complete: two waves of cannons, each one built only when it fires */
function celebrate() {
    if (prefersReducedMotion()) {
        return;
    }
    // A timer set from a frame callback fires once that frame is painted: the recap shows first
    frame = requestAnimationFrame(() => {
        after(0, cannons);
        after(450, cannons);
    });
}
```

5. Mets à jour la ligne `celebrate()` de la JSDoc en tête du fichier : `celebrate()   a level complete: two cannons from the bottom corners, in two waves, once the screen is painted`.

## Boundaries

- Ne modifie que `src/composables/useConfetti.js`. Ne touche pas `OeaEndStats.vue` : il appelle déjà `celebrate()` au montage et `clear()` au démontage, ce qui reste correct.
- D'autres fichiers sont modifiés dans l'arbre de travail par d'autres sessions (`styles.scss`, `OeaQuestGrid.vue`, `package.json`) : n'y touche pas.
- Ne change pas `burst()`, `flight()`, ni l'API publique `{ burst, celebrate, clear }`.
- Aucune nouvelle dépendance. Pas de commit.
- Si `volley()` n'existe pas (plan 001 non appliqué) ou si le code diffère des extraits, ARRÊTE-TOI et signale-le.

## Verification

- **Mécanique** : `npx prettier --check src/composables/useConfetti.js`, `npx eslint src/composables/useConfetti.js` et `npx vitest run` passent.
- **Feel check** : l'utilisateur lance `npm run dev`.
  - Console : `const c = (await import('/src/composables/useConfetti.js')).default; c.celebrate()`. Deux salves de canons, la 2e environ une demi-seconde après la 1re, comme avant.
  - `c.celebrate(); c.clear()` dans la même ligne : rien ne doit partir, même après une seconde.
  - `c.burst(innerWidth / 2, innerHeight / 2); setTimeout(() => c.celebrate(), 2700)` : les canons partent bien, même si les dernières têtes de la gerbe finissent pendant l'attente.
  - En jeu, trouver la dernière photo d'un niveau : le récap s'affiche, puis les canons partent, sans saccade au premier affichage.
  - DevTools > Performance, CPU 4× slowdown, enregistrer l'arrivée sur le récap : la création des têtes apparaît dans deux tâches séparées, après la première peinture du récap, et non plus dans la tâche du montage.
- **Done when** : `celebrate()` ne crée aucune tête de façon synchrone, `clear()` annule frame et timers, et la fin de vol des têtes passe par `dropLayerIfEmpty()`.
