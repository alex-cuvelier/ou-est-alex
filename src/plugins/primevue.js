import 'primeicons/primeicons.css';

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';

import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Dialog from 'primevue/dialog';
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
import Tooltip from 'primevue/tooltip';

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
            950: '{zinc.950}',
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{zinc.950}',
                    inverseColor: '#ffffff',
                    hoverColor: '{zinc.900}',
                    activeColor: '{zinc.800}',
                },
                highlight: {
                    background: '{zinc.950}',
                    focusBackground: '{zinc.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff',
                },
            },
            dark: {
                primary: {
                    color: '{zinc.50}',
                    inverseColor: '{zinc.950}',
                    hoverColor: '{zinc.100}',
                    activeColor: '{zinc.200}',
                },
                highlight: {
                    background: 'rgba(250, 250, 250, .16)',
                    focusBackground: 'rgba(250, 250, 250, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)',
                },
            },
        },
    },
    components: {
        drawer: {
            colorScheme: {
                light: {
                    background: 'rgba(10, 14, 39, 0.95)',
                    color: '{zinc.50}',
                    borderColor: 'transparent',
                },
                dark: {
                    background: 'rgba(10, 14, 39, 0.95)',
                    color: '{zinc.50}',
                    borderColor: 'transparent',
                },
            },
        },
    },
    // Tooltip is a directive: its tokens live under `directives`, not `components`
    directives: {
        // Inverted against the page: ink on light paper, light ink on dark paper.
        // --ink / --on-ink already switch with prefers-color-scheme (theme.scss).
        tooltip: {
            root: {
                maxWidth: '16rem',
                gutter: '0.375rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '8px',
                shadow: '0 8px 24px -8px rgba(0, 0, 0, 0.5)',
            },
            colorScheme: {
                light: {
                    root: {
                        background: 'var(--ink)',
                        color: 'var(--on-ink)',
                    },
                },
                dark: {
                    root: {
                        background: 'var(--ink)',
                        color: 'var(--on-ink)',
                    },
                },
            },
        },
    },
});

export default {
    install(app) {
        /* eslint-disable vue/multi-word-component-names, vue/no-reserved-component-names */
        app.component('Button', Button);
        app.component('Drawer', Drawer);
        app.component('Dialog', Dialog);
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
        /* eslint-enable vue/multi-word-component-names, vue/no-reserved-component-names */

        app.directive('tooltip', Tooltip);
        app.use(ToastService);

        app.use(PrimeVue, {
            theme: {
                preset: Noir,
            },
        });
    },
};
