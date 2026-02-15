import { ref, computed, watch } from 'vue';

const MINSCALE = 1;
const MAXSCALE = 10;

/**
 * Composable for handling image zoom and pan interactions.
 * Supports mouse (drag + wheel) and touch (pan + pinch-zoom).
 * Prevents out-of-bounds panning with a rubber-band effect:
 * - During drag: the image can slightly exceed bounds with dampened resistance
 * - On release: the image snaps back to bounds with a CSS transition
 *
 * @param {Function} clickCallback - Called when a click (not a drag) is detected on the image
 * @param {import('vue').Ref<HTMLElement>} wrapperRef - Template ref of the image wrapper element
 */
export default function useImageZoom(clickCallback, wrapperRef) {
    const scale = ref(MINSCALE),
        pointX = ref(0),
        pointY = ref(0),
        isDragging = ref(false);

    let panning = false,
        start = { x: 0, y: 0 },
        pointSaved = { x: 0, y: 0 }, // Saved position to distinguish click vs drag
        initialDistance = 0, // Initial distance between two touch points (pinch-zoom)
        initialScale = MINSCALE;

    const transformStyle = computed(() => {
        return {
            transform: `translate(${pointX.value}px, ${pointY.value}px) scale(${scale.value})`,
        };
    });

    // --- Bounds clamping & rubber-band effect ---

    const isSnapping = ref(false); // True during snap-back animation (triggers CSS transition)
    const DAMPING = 0.3; // Rubber-band resistance factor (0 = hard stop, 1 = no resistance)

    /**
     * Calculates max allowed pan values based on current scale.
     * At scale=1, maxX/maxY = 0 (no panning). Increases with zoom level.
     * Formula: maxPan = dimension * (scale - 1) / 2
     */
    function getBounds() {
        if (!wrapperRef.value) return null;
        const w = wrapperRef.value.offsetWidth;
        const h = wrapperRef.value.offsetHeight;
        return {
            maxX: w * (scale.value - 1) / 2,
            maxY: h * (scale.value - 1) / 2,
        };
    }

    // Hard clamp: forces position strictly within bounds (used on wheel zoom & snap-back)
    function clampPosition() {
        const bounds = getBounds();
        if (!bounds) return;
        pointX.value = Math.min(Math.max(pointX.value, -bounds.maxX), bounds.maxX);
        pointY.value = Math.min(Math.max(pointY.value, -bounds.maxY), bounds.maxY);
    }

    // Soft clamp: allows overscroll with dampened resistance (used during drag)
    function dampenPosition() {
        const bounds = getBounds();
        if (!bounds) return;
        pointX.value = dampen(pointX.value, -bounds.maxX, bounds.maxX);
        pointY.value = dampen(pointY.value, -bounds.maxY, bounds.maxY);
    }

    // Applies dampening when value exceeds [min, max] range
    function dampen(value, min, max) {
        if (value < min) return min + (value - min) * DAMPING;
        if (value > max) return max + (value - max) * DAMPING;
        return value;
    }

    // Animates the image back to bounds on release (activates CSS transition via isSnapping)
    function snapBack() {
        const bounds = getBounds();
        if (!bounds) return;
        const outOfBounds =
            pointX.value < -bounds.maxX || pointX.value > bounds.maxX ||
            pointY.value < -bounds.maxY || pointY.value > bounds.maxY;
        if (outOfBounds) {
            isSnapping.value = true;
            clampPosition();
            setTimeout(() => { isSnapping.value = false; }, 300);
        }
    }

    function resetTransform() {
        scale.value = MINSCALE;
        pointX.value = 0;
        pointY.value = 0;
    }

    // --- Mouse event handlers ---

    function onMouseDown(e) {
        e.preventDefault();
        start = { x: e.clientX - pointX.value, y: e.clientY - pointY.value };
        panning = true;
        isDragging.value = true;
        pointSaved = { x: pointX.value, y: pointY.value };
    }

    function onMouseUp(e) {
        panning = false;
        isDragging.value = false;
        snapBack();

        if (!e.target.classList.contains('oea-img')) {
            return;
        }

        // If position hasn't changed, it's a click (not a drag) — trigger callback
        if (pointSaved.x == pointX.value && pointSaved.y == pointY.value) {
            clickCallback(e);
        }
    }

    function onMouseMove(e) {
        e.preventDefault();
        if (!panning) {
            return;
        }

        let newXValue = e.clientX - start.x;
        let newYValue = e.clientY - start.y;
        const xDifference = pointX.value + newXValue;
        const yDifference = pointY.value + newYValue;

        // Ignore micro-movements (threshold scales with zoom to stay consistent)
        const threshold = 10 * scale.value;
        if (xDifference < threshold && yDifference > -threshold && yDifference < threshold && yDifference > -threshold) {
            return;
        }

        pointX.value = newXValue;
        pointY.value = newYValue;
        dampenPosition(); // Soft clamp with rubber-band resistance
    }

    // --- Wheel zoom handler ---

    function onWheel(event) {
        event.preventDefault();
        // Ignore Ctrl+scroll (browser zoom)
        if (event.ctrlKey) {
            return;
        }

        const img = event.target;
        const rec = img.getBoundingClientRect();
        // Mouse position relative to image (unscaled coordinates)
        const x = (event.clientX - rec.x) / scale.value;
        const y = (event.clientY - rec.y) / scale.value;

        const delta = event.wheelDelta ? event.wheelDelta : -event.deltaY;

        if (scale.value == MINSCALE && delta < 0) {
            resetTransform();
            return;
        }

        // Increment/decrement scale by 0.4, clamped to [MINSCALE, MAXSCALE]
        if (delta > 0) {
            if (scale.value > MAXSCALE) {
                return;
            }
            scale.value = parseFloat((scale.value + 0.4).toFixed(1));
        } else {
            if (scale.value <= MINSCALE) {
                return;
            }
            scale.value = parseFloat((scale.value - 0.4).toFixed(1));
        }

        // Adjust position to keep zoom centered on mouse cursor
        const m = delta > 0 ? 0.2 : -0.2;
        pointX.value += -x * m * 2 + img.offsetWidth * m;
        pointY.value += -y * m * 2 + img.offsetHeight * m;
        clampPosition(); // Hard clamp (no rubber-band on zoom)
    }

    // --- Touch event handlers ---

    function onTouchStart(e) {
        if (e.touches.length === 1) {
            start = { x: e.touches[0].clientX - pointX.value, y: e.touches[0].clientY - pointY.value };
            panning = true;
        } else if (e.touches.length === 2) {
            // Pinch-zoom: save initial state
            initialDistance = getDistance(e.touches);
            initialScale = scale.value;
            start = getMidPoint(e.touches);
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (panning && e.touches.length === 1) {
            let newXValue = e.touches[0].clientX - start.x;
            let newYValue = e.touches[0].clientY - start.y;
            pointX.value = newXValue;
            pointY.value = newYValue;
            dampenPosition(); // Soft clamp with rubber-band resistance
        } else if (e.touches.length === 2) {
            // Pinch-zoom: scale proportional to finger distance change
            const currentDistance = getDistance(e.touches);
            const scaleChange = currentDistance / initialDistance;
            scale.value = Math.min(Math.max(initialScale * scaleChange, MINSCALE), MAXSCALE);
            clampPosition(); // Hard clamp (no rubber-band on zoom)
        }
    }

    function onTouchEnd() {
        panning = false;
        isDragging.value = false;
        snapBack(); // Animate back to bounds if overscrolled
    }

    // --- Touch utility functions ---

    // Euclidean distance between two touch points
    function getDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Midpoint between two touch points
    function getMidPoint(touches) {
        const x = (touches[0].clientX + touches[1].clientX) / 2;
        const y = (touches[0].clientY + touches[1].clientY) / 2;
        return { x, y };
    }

    // Auto-reset position when zoom returns to 1x
    watch(scale, (value) => {
        if (value == MINSCALE) {
            resetTransform();
        }
    });

    return {
        isDragging,
        isSnapping,
        transformStyle,
        resetTransform,
        onMouseDown,
        onMouseUp,
        onMouseMove,
        onWheel,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    };
}
