import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

// Function to detect user preferred language
function getUserLocale() {
  const navLang = navigator.language || navigator.userLanguage;
  const locale = navLang.split('-')[0]; // Get the base language code (e.g., 'en' from 'en-US')
  return locale;
}

const messages = {
  en,
  fr
};

const userLocale = getUserLocale();

const i18n = createI18n({
  locale: messages[userLocale] ? userLocale : 'fr', // Use user preferred language if available, else fallback to 'en'
  fallbackLocale: 'fr', // Set fallback locale
  messages, // Set locale messages
});

export default i18n;
