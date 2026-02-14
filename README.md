# 🔍 Où est Alex ?

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-0.3.0-blue)]()
[![License](https://img.shields.io/badge/license-private-red)]()

> Un jeu de type "Où est Charlie?" - Trouvez Alex dans des images complexes !

🎮 **[Jouer maintenant →](https://ouestalex.fr)**

![Où est Alex Screenshot](https://ouestalex.fr/images/ogImage.jpeg)

---

## ✨ Fonctionnalités

-   🎯 **6 niveaux de difficulté** - Du débutant à l'expert
-   🔍 **Système de zoom/pan** - Navigation fluide sur mobile et desktop
-   💡 **Système d'indices** - Cercle d'aide qui rétrécit à chaque utilisation
-   🌍 **Multilingue** - Interface en Français et Anglais
-   📊 **Statistiques** - Suivez vos performances (temps, indices, erreurs)
-   🛠️ **Éditeur de quêtes** - Interface d'ajout de nouvelles images
-   🎉 **Effets visuels** - Confettis et sons de victoire
-   📱 **Responsive** - Jouable sur mobile, tablette et desktop
-   ⌨️ **Navigation clavier** - Utilisez ← et → pour naviguer

---

## 🚀 Installation

### Prérequis

-   [Node.js](https://nodejs.org/) v16 ou supérieur
-   npm ou yarn

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/ou-est-alex.git
cd ou-est-alex

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Ouvrir votre navigateur sur http://localhost:8080
```

---

## 📜 Scripts disponibles

| Script                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Lance le serveur de développement sur le port 8080 |
| `npm run dev-host`      | Lance le serveur accessible sur le réseau local    |
| `npm run build`         | Crée la version de production dans `/dist`         |
| `npm run preview`       | Prévisualise le build de production                |
| `npm test`              | Lance les tests unitaires avec Vitest              |
| `npm run test:ui`       | Lance Vitest avec interface graphique              |
| `npm run test:coverage` | Génère le rapport de couverture de code            |
| `npm run lint`          | Vérifie et corrige les erreurs ESLint              |
| `npm run format`        | Formate le code avec Prettier                      |

---

## 🏗️ Architecture

### Stack technique

-   **Framework:** [Vue 3](https://vuejs.org/) (Composition API)
-   **Build Tool:** [Vite](https://vitejs.dev/) 7.x
-   **State Management:** [Pinia](https://pinia.vuejs.org/)
-   **UI Library:** [PrimeVue](https://primevue.org/) 4.x
-   **Routing:** [Vue Router](https://router.vuejs.org/) 4.x
-   **Internationalization:** [Vue I18n](https://vue-i18n.intlify.dev/)
-   **Testing:** [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/)
-   **Linting:** ESLint + Prettier

### Structure du projet

```
ou-est-alex/
├── public/                    # Fichiers statiques
│   └── images/               # Images du jeu
├── src/
│   ├── assets/               # Assets (styles, sons, icônes)
│   │   ├── sounds/          # Fichiers audio
│   │   ├── styles/          # Styles SCSS globaux
│   │   └── icons/           # Icônes SVG
│   ├── components/           # Composants Vue réutilisables
│   │   ├── OeaHeader.vue
│   │   ├── OeaCurrentQuestStats.vue
│   │   └── OeaEndStats.vue
│   ├── composables/          # Logique réutilisable (Composition API)
│   │   ├── useConfetti.js
│   │   ├── useImageZoom.js
│   │   └── useSounds.js
│   ├── locales/              # Fichiers de traduction
│   │   ├── fr.json
│   │   └── en.json
│   ├── plugins/              # Plugins Vue
│   │   ├── i18n.js
│   │   └── primevue.js
│   ├── router/               # Configuration Vue Router
│   │   └── index.js
│   ├── stores/               # Stores Pinia
│   │   └── questsStore.js
│   ├── utils/                # Fonctions utilitaires
│   │   └── utils.js
│   ├── views/                # Pages/Vues principales
│   │   ├── OeaView.vue      # Vue principale du jeu
│   │   ├── OeaLevelChooser.vue
│   │   └── OeaAddImageView.vue
│   ├── App.vue               # Composant racine
│   ├── main.js               # Point d'entrée
│   └── quests.json           # Données des quêtes
├── .github/workflows/        # CI/CD GitHub Actions
├── package.json
├── vite.config.js
├── vitest.config.js
└── README.md
```

---

## 🎮 Comment jouer

1. **Choisissez un niveau** - 6 niveaux de difficulté disponibles
2. **Cherchez Alex** - Cliquez sur l'image où vous pensez qu'Alex se cache
3. **Utilisez les indices** - Cliquez sur le bouton `?` pour afficher un cercle d'aide (rétrécit à chaque utilisation)
4. **Zoomez et déplacez** - Utilisez la souris ou le tactile pour naviguer :
    - **Souris:** Clic+glisser pour déplacer, molette pour zoomer
    - **Tactile:** Pincer pour zoomer, glisser avec un doigt pour déplacer
5. **Naviguez** - Flèches ← → pour passer aux quêtes suivantes/précédentes
6. **Consultez vos stats** - Temps, indices utilisés et erreurs affichés en bas

---

## 📝 Format des quêtes (quests.json)

```json
{
    "id": 1,
    "url": "/images/quest-01.jpg",
    "coords": "1250,890,1290,920,1310,950",
    "width": 3840,
    "height": 2160,
    "difficultyLevel": 0
}
```

### Propriétés

-   **id:** Identifiant unique de la quête
-   **url:** Chemin vers l'image
-   **coords:** Coordonnées du polygone (format: `x1,y1,x2,y2,x3,y3,...`)
-   **width/height:** Dimensions originales de l'image
-   **difficultyLevel:** Niveau de difficulté (0-5)
-   **type:** `"end"` pour marquer la fin d'un niveau (optionnel)

---

## 🛠️ Ajouter une nouvelle quête

### Méthode 1 : Via l'interface

1. Accédez à `/alex` (route d'administration)
2. **Étape 1:** Glissez-déposez votre image (support HEIC)
3. **Étape 2:** Ajustez les dimensions si nécessaire
4. **Étape 3:** Dessinez le polygone autour d'Alex :
    - Cliquez pour ajouter des points
    - Glissez les points pour les déplacer
5. **Étape 4:** Copiez le JSON généré et ajoutez-le à `src/quests.json`

### Méthode 2 : Manuellement

1. Ajoutez l'image dans `/public/images/`
2. Créez un nouvel objet dans `src/quests.json`
3. Définissez les coordonnées du polygone
4. Testez dans le jeu

---

## 🧪 Tests

Le projet utilise **Vitest** pour les tests unitaires.

```bash
# Lancer tous les tests
npm test

# Mode watch
npm test -- --watch

# Interface graphique
npm run test:ui

# Couverture de code
npm run test:coverage
```

### Couverture actuelle

-   ✅ **Utilitaires** (utils.js) - 27 tests
-   ✅ **Composables** (useSounds.js) - 8 tests
-   ⚠️ **Store** (questsStore.js) - Tests partiels

---

## 🌐 Déploiement

Le projet est configuré avec GitHub Actions pour un déploiement automatique.

### Workflow CI/CD

-   **Déclenchement:** Push sur `main` ou déclenchement manuel
-   **Étapes:**
    1. Checkout du code
    2. Installation des dépendances
    3. Build de production
    4. Déploiement via SSH/rsync

### Build manuel

```bash
npm run build
# Les fichiers de production sont dans /dist
```

---

## 🔧 Configuration

### Vite (vite.config.js)

-   Port de développement: `8080`
-   Alias `@` pointant vers `/src`
-   Plugin Vue 3

### ESLint + Prettier

-   Règles Vue 3 recommandées
-   Auto-fix sur save
-   Format: 4 espaces, single quotes, 160 caractères max

### Variables d'environnement

Aucune variable d'environnement requise pour l'instant.

---

## 🐛 Problèmes connus

Consultez les [Issues GitHub](https://github.com/votre-username/ou-est-alex/issues) pour les bugs en cours.

---

## 📄 Licence

Projet privé - Tous droits réservés

---

## 👨‍💻 Auteur

Créé avec ❤️ par Alex

---

## 🙏 Remerciements

-   Vue.js community
-   PrimeVue pour l'UI

---

<div align="center">

**[⬆ Retour en haut](#-où-est-alex-)**

Made with Vue 3 + Vite | [Site web](https://ouestalex.fr)

</div>
