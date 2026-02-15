import { ref, computed, onMounted, onUnmounted } from 'vue';

export default function useDeviceDetection() {
    const windowWidth = ref(window.innerWidth);

    const updateWidth = () => {
        windowWidth.value = window.innerWidth;
    };

    onMounted(() => {
        window.addEventListener('resize', updateWidth);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth);
    });

    const isMobile = computed(() => windowWidth.value <= 768);
    const isTouchDevice = computed(() => 'ontouchstart' in window);

    return {
        isMobile,
        isTouchDevice,
        windowWidth,
    };
}
