import { createRouter, createWebHashHistory } from 'vue-router';
import OeaView from '@/views/OeaView.vue';

const router = createRouter({
    history: createWebHashHistory(),
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
