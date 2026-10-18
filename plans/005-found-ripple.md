# 005 — Une onde au départ de la gerbe

- **Status**: ABANDONED — retirée après essai : l’onde et l’anneau rouge grandissaient chacun à leur rythme, sans harmonie
- **Commit**: f912ca0, **plans 001 et 002 appliqués** (prérequis ; 003 et 004 peuvent l'être ou non)
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 fichier, ~30 lignes dans `src/composables/useConfetti.js`

## Problem

Quand on trouve Alex, la photo zoome pour amener l'anneau rouge au centre, et les têtes jaillissent de ce centre (`src/views/OeaView.vue:458-464`, appel `confetti.burst(...)`). Rien ne marque le point de départ : les têtes surgissent de nulle part. Une onde qui part de ce point au même instant donne à la gerbe une origine, comme une petite explosion qui lance les têtes.

```js
/* src/composables/useConfetti.js — current, after plans 001 and 002 */
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

```js
/* src/composables/useConfetti.js — current, after plan 002 */
// Once the last head has landed: nothing left to cancel, and a wave still to fire must keep its timer
function dropLayerIfEmpty() {
    if (layer && !layer.childElementCount) {
        layer.remove();
        layer = null;
    }
}
```

## Target

- Au début de `burst()`, un anneau **blanc** part du point `(x, y)` : il s'agrandit de 30 % à 100 % de son diamètre et s'efface.
- Il est blanc, pas rouge : au départ, l'anneau rouge d'Alex peut être ailleurs à l'écran (le zoom l'amène au centre). Deux cercles rouges à deux endroits se liraient comme deux trouvailles.
- Diamètre final : `0.5 * Math.min(width, height)` du calque.
- Trait : `border: 3px solid rgba(255, 255, 255, 0.9)`, plus un liseré sombre pour rester lisible sur une photo claire : `box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2)`.
- Mouvement : `transform` seulement, de `translate(-50%, -50%) scale(0.3)` à `translate(-50%, -50%) scale(1)`, en 650 ms, courbe `cubic-bezier(0.22, 1, 0.36, 1)`. C'est la valeur du jeton `--ease-out` de `src/assets/styles/theme.scss:23`, recopiée parce que WAAPI ne lit pas les variables CSS dans `easing`.
- Opacité : une seconde animation, linéaire, sur les mêmes 650 ms. Elle reste à 0,9 jusqu'à 30 % de la durée, puis descend à 0. Séparée du `transform`, sinon la courbe ease-out effacerait l'anneau avant qu'il ait grandi.
- Seules `transform` et `opacity` sont animées, donc le GPU joue l'onde seul, comme les têtes.
- L'onde est ajoutée au calque **avant** la salve, pour que les têtes passent devant.
- En mouvement réduit, rien ne change : `burst()` s'arrête déjà avant, donc pas d'onde.
- `celebrate()` n'a pas d'onde.

## Repo conventions to follow

- Code et commentaires en anglais, commentaires rares, sur une ligne, qui expliquent le pourquoi. Pas de renvoi à ce plan.
- Prettier du dépôt : 4 espaces, `printWidth` 160.
- Même façon de créer un élément que les têtes dans `volley()` : `document.createElement`, `style.cssText` en une ligne, `opacity: 0` de base pour qu'il soit invisible hors animation, retrait dans `onfinish` puis `dropLayerIfEmpty()`.

## Steps

1. Dans la section `// --- Heads ---`, juste au-dessus de `volley()`, ajoute :

```js
/** Where the heads spring from: a white ring ripples out, white not to be taken for Alex's red ring on its way */
function ripple(x, y, diameter) {
    const ring = document.createElement('div');
    ring.style.cssText = `position: absolute; left: ${x}px; top: ${y}px; width: ${diameter}px; height: ${diameter}px; border: 3px solid rgba(255, 255, 255, 0.9); border-radius: 50%; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2); opacity: 0;`;
    getLayer().appendChild(ring);

    const duration = 650;
    const growth = ring.animate([{ transform: 'translate(-50%, -50%) scale(0.3)' }, { transform: 'translate(-50%, -50%) scale(1)' }], {
        duration,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
    // Linear and held at first: with the growth's ease-out, the ring would be gone before it has grown
    ring.animate([{ opacity: 0.9 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0 }], { duration });
    growth.onfinish = () => {
        ring.remove();
        dropLayerIfEmpty();
    };
}
```

2. Dans `burst()`, lis aussi la largeur et lance l'onde avant la salve :

```js
    const { clientWidth: width, clientHeight: height } = getLayer();
    ripple(x, y, 0.5 * Math.min(width, height));
    const shots = [];
```

   (remplace la ligne `const height = getLayer().clientHeight;` ; le reste de `burst()` ne change pas).

3. Mets à jour la ligne `burst(x, y)` de la JSDoc en tête du fichier : `burst(x, y)   a find: a ripple and a fountain of heads from the spot where Alex was hiding`.

## Boundaries

- Ne modifie que `src/composables/useConfetti.js`. Ne touche pas `OeaView.vue` ni l'anneau `.oea-alex-ring`.
- D'autres fichiers sont modifiés dans l'arbre de travail par d'autres sessions (`styles.scss`, `OeaQuestGrid.vue`, `package.json`) : n'y touche pas.
- Ne change ni `volley()`, ni `flight()`, ni `celebrate()`, ni l'API publique `{ burst, celebrate, clear }`.
- Pas de `filter`, pas de `box-shadow` animé : `transform` et `opacity` uniquement.
- Aucune nouvelle dépendance. Pas de commit.
- Si `volley()` ou `dropLayerIfEmpty()` n'existent pas (plans 001 et 002 non appliqués), ARRÊTE-TOI et signale-le.

## Verification

- **Mécanique** : `npx prettier --check src/composables/useConfetti.js`, `npx eslint src/composables/useConfetti.js` et `npx vitest run` passent.
- **Feel check** : l'utilisateur lance `npm run dev`.
  - Console : `const c = (await import('/src/composables/useConfetti.js')).default; c.burst(innerWidth / 2, innerHeight / 2)`. Un anneau blanc part du centre en même temps que les têtes, s'élargit et s'efface. Les têtes passent devant lui.
  - DevTools > Animations, vitesse 10 % : l'anneau est encore bien visible à mi-croissance, et il a disparu avant les têtes.
  - `c.burst(…); c.clear()` : l'onde disparaît avec les têtes.
  - En jeu, sur une vraie trouvaille avec Alex **près du centre**, puis avec Alex **dans un coin** de la photo. Dans le second cas, l'onde part du centre pendant que l'anneau rouge voyage encore. Vérifie que ça se lit comme un seul geste. Si ça paraît décousu, signale-le : les réglages possibles (retarder l'onde jusqu'à l'arrivée de l'anneau, changer sa taille) sont à décider par l'utilisateur, ne les change pas toi-même.
  - Sur une photo claire et sur une photo sombre : l'onde reste lisible.
- **Done when** : chaque `burst()` crée une onde, et seule l'onde de `burst()` existe (`celebrate()` n'en a pas).
