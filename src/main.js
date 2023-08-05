import './assets/base.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import fontawesome from '@/plugins/fontawesome';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(fontawesome);

app.mount('#app');
