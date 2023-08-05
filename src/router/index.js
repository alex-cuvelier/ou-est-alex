import { createRouter, createWebHistory } from 'vue-router';
import OeaView from '@/views/OeaView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: OeaView,
        },
        {
            path: '/:imageIndex',
            name: 'homeIndex',
            component: OeaView,
        },
    ],
});

export default router;
