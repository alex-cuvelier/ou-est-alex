/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core';

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

/* import specific icons */
import { faArrowLeft, faArrowRight, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

/* add icons to the library */
library.add(faArrowLeft);
library.add(faArrowRight);
library.add(faQuestionCircle);

export default {
    install(app) {
        app.component('font-awesome-icon', FontAwesomeIcon);
    },
};
