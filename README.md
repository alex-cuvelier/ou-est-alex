# 🔍 Où est alex ?

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> Where the hell could he be ?

🎮 **[Play Now →](https://ouestalex.fr)**

![Where is Alex Screenshot](https://ouestalex.fr/images/ogImage.jpeg)

---

## ✨ Features

-   🎯 **6 difficulty levels** - From beginner to expert
-   🔍 **Zoom/pan system** - Smooth navigation on mobile and desktop
-   💡 **Hint system** - Help circle that shrinks with each use
-   🌍 **Multilingual** - Interface in French and English
-   📊 **Progress** - Found photos, best times and play time saved in the browser, with a "Resume" card
-   🖼️ **End-of-level recap** - Mosaic of the photos with Alex circled, and a result to copy and share
-   🛠️ **Quest editor** - Interface for adding new images
-   🎉 **Visual effects** - Confetti and victory sounds
-   📱 **Responsive** - Playable on mobile, tablet and desktop
-   ⌨️ **Keyboard navigation** - Use ← and → to navigate

---

## 🚀 Installation

### Prerequisites

-   [Node.js](https://nodejs.org/) v16 or higher
-   npm or yarn

### Local Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ou-est-alex.git
cd ou-est-alex

# Install dependencies
npm install

# Run in development mode
npm run dev

# Open your browser at http://localhost:8080
```

---

## 📜 Available Scripts

| Script                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Starts development server on port 8080    |
| `npm run dev-host`      | Starts server accessible on local network |
| `npm run thumbs`        | Generates the WebP thumbnails             |
| `npm run build`         | Creates production build in `/dist`       |
| `npm run preview`       | Previews production build                 |
| `npm test`              | Runs unit tests with Vitest               |
| `npm run test:ui`       | Runs Vitest with graphical interface      |
| `npm run test:coverage` | Generates code coverage report            |
| `npm run lint`          | Checks and fixes ESLint errors            |
| `npm run format`        | Formats code with Prettier                |

---

## 🏗️ Architecture

### Tech Stack

-   **Framework:** [Vue 3](https://vuejs.org/) (Composition API)
-   **Build Tool:** [Vite](https://vitejs.dev/) 7.x
-   **State Management:** [Pinia](https://pinia.vuejs.org/)
-   **UI Library:** [PrimeVue](https://primevue.org/) 4.x
-   **Routing:** [Vue Router](https://router.vuejs.org/) 4.x
-   **Internationalization:** [Vue I18n](https://vue-i18n.intlify.dev/)
-   **Testing:** [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/)
-   **Linting:** ESLint + Prettier

### Project Structure

```
ou-est-alex/
├── public/                    # Static files
│   └── images/               # Game images
├── src/
│   ├── assets/               # Assets (styles, sounds, icons)
│   │   ├── sounds/          # Audio files
│   │   ├── styles/          # Global SCSS styles
│   │   └── icons/           # SVG icons
│   ├── components/           # Reusable Vue components
│   │   ├── OeaHeader.vue          # Editor header
│   │   ├── OeaQuestGrid.vue       # Photo picker (bottom sheet)
│   │   └── OeaEndStats.vue        # End-of-level recap
│   ├── composables/          # Reusable logic (Composition API)
│   │   ├── useConfetti.js
│   │   ├── useImageZoom.js
│   │   └── useSounds.js
│   ├── locales/              # Translation files
│   │   ├── fr.json
│   │   └── en.json
│   ├── plugins/              # Vue plugins
│   │   ├── i18n.js
│   │   └── primevue.js
│   ├── router/               # Vue Router configuration
│   │   └── index.js
│   ├── stores/               # Pinia stores
│   │   ├── questsStore.js
│   │   └── uiStore.js
│   ├── utils/                # Utility functions
│   │   └── utils.js
│   ├── views/                # Main pages/views
│   │   ├── OeaView.vue      # Main game view
│   │   ├── OeaLevelChooser.vue
│   │   └── OeaAddImageView.vue
│   ├── App.vue               # Root component
│   ├── main.js               # Entry point
│   └── quests.json           # Quest data
├── .github/workflows/        # CI/CD GitHub Actions
├── package.json
├── vite.config.js
├── vitest.config.js
└── README.md
```

---

## 🎮 How to Play

1. **Choose a level** - 6 difficulty levels available
2. **Find Alex** - Click on the image where you think Alex is hiding
3. **Use hints** - Click the compass button to display a help circle (shrinks with each use)
4. **Zoom and pan** - Use mouse or touch to navigate:
    - **Mouse:** Click+drag to move, scroll wheel to zoom
    - **Touch:** Pinch to zoom, swipe with one finger to move
5. **Navigate** - Arrow keys ← → to go to next/previous quests
6. **Check your stats** - Time, hints used and misses are shown in the bottom bar, then recapped at the end of the level

---

## 📝 Quest Format (quests.json)

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

### Properties

-   **id:** Unique quest identifier
-   **url:** Path to image
-   **coords:** Polygon coordinates (format: `x1,y1,x2,y2,x3,y3,...`)
-   **width/height:** Original image dimensions
-   **difficultyLevel:** Difficulty level (0-5)
-   **type:** `"end"` to mark the end of a level (optional)

---

## 🛠️ Adding a New Quest

### Method 1: Via Interface

1. Access `/alex` (admin route)
2. **Step 1:** Drag and drop your image (HEIC support)
3. **Step 2:** Adjust dimensions if necessary
4. **Step 3:** Draw the polygon around Alex:
    - Click to add points
    - Drag points to move them
5. **Step 4:** Copy the generated JSON and add it to `src/quests.json`
6. Run `npm run thumbs` to generate the thumbnail (also done automatically before `npm run build`)

### Method 2: Manually

1. Add the image to `/public/images/` and run `npm run thumbs`
2. Create a new object in `src/quests.json`
3. Define polygon coordinates
4. Test in the game

---

## 🧪 Testing

The project uses **Vitest** for unit testing.

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Graphical interface
npm run test:ui

# Code coverage
npm run test:coverage
```

### Current Coverage

-   ✅ **Utilities** (utils.js) - 27 tests
-   ✅ **Composables** (useSounds.js) - 8 tests
-   ⚠️ **Store** (questsStore.js) - Partial tests

---

## 🌐 Deployment

The project is configured with GitHub Actions for automatic deployment.

### CI/CD Workflow

-   **Trigger:** Push to `main` or manual trigger
-   **Steps:**
    1. Code checkout
    2. Install dependencies
    3. Production build
    4. Deploy via SSH/rsync

### Manual Build

```bash
npm run build
# Production files are in /dist
```

---

## 🔧 Configuration

### Vite (vite.config.js)

-   Development port: `8080`
-   Alias `@` pointing to `/src`
-   Vue 3 plugin

### ESLint + Prettier

-   Vue 3 recommended rules
-   Auto-fix on save
-   Format: 4 spaces, single quotes, 160 characters max

### Environment Variables

No environment variables required at this time.

---

## 🐛 Known Issues

Check [GitHub Issues](https://github.com/your-username/ou-est-alex/issues) for current bugs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Created with ❤️ by Alex

---

## 🙏 Acknowledgments

-   Vue.js community
-   PrimeVue for UI

---

<div align="center">

**[⬆ Back to top](#-where-is-alex)**

Made with Vue 3 + Vite | [Website](https://ouestalex.fr)

</div>
