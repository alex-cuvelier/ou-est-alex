import 'primeicons/primeicons.css'

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Card from 'primevue/card';
import SelectButton from 'primevue/selectbutton';
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import StepItem from 'primevue/stepitem';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';

import ToastService from 'primevue/toastservice';

const Noir = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{zinc.950}',
                    inverseColor: '#ffffff',
                    hoverColor: '{zinc.900}',
                    activeColor: '{zinc.800}'
                },
                highlight: {
                    background: '{zinc.950}',
                    focusBackground: '{zinc.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                }
            },
            dark: {
                primary: {
                    color: '{zinc.50}',
                    inverseColor: '{zinc.950}',
                    hoverColor: '{zinc.100}',
                    activeColor: '{zinc.200}'
                },
                highlight: {
                    background: 'rgba(250, 250, 250, .16)',
                    focusBackground: 'rgba(250, 250, 250, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});


export default {
    install(app) {

        app.component('Button', Button);
        app.component('Drawer', Drawer);
        app.component('Card', Card);
        app.component('SelectButton', SelectButton);
        app.component('Stepper', Stepper);
        app.component('StepList', StepList);
        app.component('StepPanels', StepPanels);
        app.component('StepItem', StepItem);
        app.component('Step', Step);
        app.component('StepPanel', StepPanel);
        app.component('InputText', InputText);
        app.component('Toast', Toast);

        app.use(ToastService);

        app.use(PrimeVue, {
            theme: {
                preset: Noir
            }
        });
    }
}