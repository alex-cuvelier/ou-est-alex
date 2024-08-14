import '@/assets/styles/styles.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/App.vue';
import router from '@/router';
import i18n from '@/plugins/i18n';
import primevue from '@/plugins/primevue';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(primevue);

app.mount('#app');
