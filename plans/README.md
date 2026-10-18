# Plans d'animation

Confettis de têtes d'Alex (`src/composables/useConfetti.js`) : moins de risque de saccade au lancement, et une gerbe plus vivante. Les cinq plans touchent ce seul fichier. Ils ont été écrits sur le commit f912ca0.

| # | Plan | Gravité | Dépend de | Status |
| --- | --- | --- | --- | --- |
| 001 | [Lancer les têtes en une seule mise en page](001-confetti-one-layout-per-volley.md) | MEDIUM | — | APPLIED |
| 002 | [Fin de niveau : salves créées à leur tour, après l'affichage du récap](002-celebrate-after-first-paint.md) | MEDIUM | 001 | APPLIED |
| 003 | [Donner de la profondeur aux têtes](003-confetti-depth.md) | MEDIUM | 001 | APPLIED |
| 004 | [Faire éclore les têtes avec un petit rebond](004-confetti-pop-overshoot.md) | LOW | — | APPLIED |
| 005 | [Une onde au départ de la gerbe](005-found-ripple.md) | LOW | 001, 002 | ABANDONED |

## Ordre d'exécution

001 → 002 → 003 → 004 → 005, un plan à la fois, dans le même arbre de travail.

- 001 crée `volley()`, que 002, 003 et 005 modifient ou utilisent.
- 002 crée `dropLayerIfEmpty()`, que 005 utilise.
- 004 est indépendant et peut passer à n'importe quel moment.

Chaque plan s'arrête si le code trouvé ne correspond pas à ses extraits. Ne pas sauter un prérequis.

## Après exécution

Faire un essai en jeu sur téléphone : une trouvaille, puis une fin de niveau. Les feel checks des plans 003 à 005 demandent un œil humain : la profondeur se lit-elle, le rebond reste-t-il discret, l'onde forme-t-elle un seul geste avec la gerbe ?

Hors de ces plans, mais à mesurer si ça rame encore sur téléphone : le flou des surfaces vitrées (`backdrop-filter` du dock, de la carte « Trouvé » et des pastilles). Il est recalculé à chaque image tant que la photo zoome dessous. C'est possible, mais pas confirmé.
