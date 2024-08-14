import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';


import Popover from 'primevue/popover';


export default {
    install(app) {

        app.component('Popover', Popover);


        app.use(PrimeVue, {
            theme: {
                preset: Aura
            }
        });
    }
}