// Tooltips need a pointer that hovers: on touch screens a tap would leave them stuck open
const canHover = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;

/**
 * Options for PrimeVue's v-tooltip directive: short delay, off on touch screens.
 *   <button v-tooltip.top="tooltip($t('quest.next'))">
 */
export function tooltip(text) {
    return { value: text, disabled: !canHover, showDelay: 300 };
}
