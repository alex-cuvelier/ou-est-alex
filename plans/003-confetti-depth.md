# 003 — Donner de la profondeur aux têtes

- **Status**: APPLIED (feel check à faire)
- **Commit**: f912ca0, **plan 001 appliqué** (prérequis ; 002 peut l'être ou non)
- **Severity**: MEDIUM
- **Category**: Cohesion / missed opportunity (rendu)
- **Estimated scope**: 1 fichier, ~10 lignes dans `src/composables/useConfetti.js`

## Problem

La taille d'une tête (`random(44, 72)`), sa vitesse (tirée par `burst()` ou `cannons()`/`celebrate()`) et son ordre d'empilement (l'ordre d'ajout dans la page) sont indépendants. Une petite tête peut filer plus vite et passer devant une grande : tout paraît sur le même plan, la gerbe est plate.

```js
/* src/composables/useConfetti.js — current, after plan 001, in volley() */
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
```

```js
/* src/composables/useConfetti.js — current, in flight() */
function flight({ x, y, vx, vy, size, life }, screenHeight) {
    // …
        vx *= drag;
        vy = vy * drag + GRAVITY * STEP;
```

## Target

Chaque tête reçoit une profondeur `depth` tirée uniformément dans [0, 1] (0 = au loin, 1 = tout près). On en déduit un facteur de perspective `pace = 0.6 + 0.4 * depth`, de 0,6 à 1, appliqué comme le ferait une vraie perspective, à tout ce qui est vu à l'écran :

- **taille** : `size = 72 * pace`, soit de 43 à 72 px, la même plage qu'aujourd'hui (44-72) ;
- **vitesse de départ** : `vx` et `vy` multipliés par `pace` ;
- **gravité** : `GRAVITY * pace`, pour que les têtes lointaines montent moins haut et retombent plus lentement, de façon cohérente ;
- **empilement** : `z-index: Math.round(depth * 100)`, pour que les têtes proches passent devant.

Le calque est en `position: fixed`, donc c'est un contexte d'empilement : les `z-index` des têtes restent dans le calque, qui reste sous les pastilles, le dock et la carte.

Les têtes les plus proches (`pace = 1`) se comportent exactement comme aujourd'hui. Les plus lointaines montent à 60 % de cette hauteur. Les angles, délais, durées de vie, la rotation et le balancement ne changent pas.

## Repo conventions to follow

- Code et commentaires en anglais, commentaires rares, sur une ligne, qui expliquent le pourquoi. Pas de renvoi à ce plan.
- Prettier du dépôt : 4 espaces, `printWidth` 160.
- Les paramètres de `flight()` se passent dans l'objet en premier argument : ajouter `pace` à cet objet.

## Steps

1. Dans `flight()`, ajoute `pace` à la déstructuration et applique-le à la gravité :

```js
function flight({ x, y, vx, vy, size, life, pace }, screenHeight) {
```

```js
        vx *= drag;
        vy = vy * drag + GRAVITY * pace * STEP;
```

   Ajoute à la JSDoc de `flight()` la phrase : `Seen at a depth: pace scales its speeds and gravity, as a perspective would.`

2. Dans `volley()`, remplace la ligne `const size = random(44, 72); …` par :

```js
        const depth = Math.random(); // 0 far away, 1 close: far heads are smaller, slower and behind
        const pace = 0.6 + 0.4 * depth;
        const size = 72 * pace; // Height in px, the width follows the image
```

3. Dans `volley()`, ajoute le `z-index` au style de la tête :

```js
        head.style.cssText = `position: absolute; left: 0; top: 0; z-index: ${Math.round(depth * 100)}; height: ${size}px; transform-origin: 0 0; opacity: 0;`;
```

4. Dans `volley()`, passe la vitesse et `pace` à `flight()` :

```js
        const keyframes = flight({ x, y, vx: Math.cos(angle) * speed * pace, vy: Math.sin(angle) * speed * pace, size, life, pace }, screenHeight);
```

## Boundaries

- Ne modifie que `src/composables/useConfetti.js`. D'autres fichiers sont modifiés dans l'arbre de travail par d'autres sessions (`styles.scss`, `OeaQuestGrid.vue`, `package.json`) : n'y touche pas.
- Ne change pas `burst()`, `celebrate()`, `cannons()` (s'il existe), ni les constantes, ni l'API publique.
- Pas d'opacité réduite ni de `filter` (flou, luminosité) pour les têtes lointaines : un filtre sur un élément animé coûte cher sur téléphone.
- Aucune nouvelle dépendance. Pas de commit.
- Si `volley()` n'existe pas (plan 001 non appliqué) ou si le code diffère des extraits, ARRÊTE-TOI et signale-le.

## Verification

- **Mécanique** : `npx prettier --check src/composables/useConfetti.js`, `npx eslint src/composables/useConfetti.js` et `npx vitest run` passent.
- **Feel check** : l'utilisateur lance `npm run dev`. Console : `const c = (await import('/src/composables/useConfetti.js')).default`, puis `c.burst(innerWidth / 2, innerHeight / 2)` et `c.celebrate()`.
  - On distingue deux plans : des petites têtes qui montent moins haut et tombent lentement, des grandes qui partent plus fort et passent devant.
  - DevTools > Animations, vitesse 10 % : une petite tête ne passe jamais devant une grande.
  - En jeu, sur une vraie trouvaille : les têtes retombent toujours à côté d'Alex, pas sur lui, pendant le zoom.
  - En fin de niveau : les deux jets se croisent toujours, les grandes têtes montent toujours vers 90 % de la hauteur de l'écran.
- **Done when** : la taille, la vitesse, la gravité et le `z-index` d'une tête dépendent tous du même `depth`.
