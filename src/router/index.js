import { createRouter, createWebHashHistory } from 'vue-router';
import OeaView from '@/views/OeaView.vue';
import OeaLevelChooser from '@/views/OeaLevelChooser.vue';
import OeaAddImageView from '@/views/OeaAddImageView.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'levelChooser',
            component: OeaLevelChooser,
        },
        {
            path: '/:difficultyLevel/:imageIndex',
            name: 'quest',
            component: OeaView,
        },
        {
          path: '/alex',
          name: 'addImage',
          component: OeaAddImageView,

        }
    ],
});

// Define the beforeEach navigation guard
router.beforeEach((to, from, next) => {
    // Check if it's the first connection
    const isFirstConnection = !localStorage.getItem('hasVisited');
  
    if (isFirstConnection) {
      // Store the state in localStorage
      localStorage.setItem('hasVisited', 'true');
      // Redirect to /quest/0/1
      next({ name: 'quest', params: { difficultyLevel: 0, imageIndex: 1 } });
    } else {
      // Allow the navigation
      next();
    }
  });

export default router;
