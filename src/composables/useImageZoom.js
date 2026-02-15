import { ref, computed, watch } from 'vue';

const MINSCALE = 1;
const MAXSCALE = 10;

/**
 * Composable for handling image zoom and pan interactions.
 * Transforms the image with 3 values: pointX, pointY (position) and scale (zoom),
 * combined into a CSS `translate(X, Y) scale(S)`.
 *
 * Interactions:
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │                   MOUSE                         │
 *   │                                                 │
 *   │  mousedown ──► save origin                      │
 *   │       │                                         │
 *   │       ▼                                         │
 *   │  mousemove ──► translate image (soft clamp)     │
 *   │       │                                         │
 *   │       ▼                                         │
 *   │  mouseup ──► distance < 5px ? ──► YES = click   │
 *   │       │                          NO  = drag     │
 *   │       └──► snapBack if out of bounds            │
 *   │                                                 │
 *   │  wheel ──► scale ±0.4, zoom centered on cursor  │
 *   ├─────────────────────────────────────────────────┤
 *   │                   TOUCH                         │
 *   │                                                 │
 *   │  1 finger ──► pan (same logic as mouse)         │
 *   │  2 fingers ──► pinch-zoom (distance ratio)      │
 *   │  touchend ──► snapBack                          │
 *   └─────────────────────────────────────────────────┘
 *
 * Bounds system:
 *
 *   maxPan = dimension * (scale - 1) / 2
 *
 *   ◄────────────┼────────────►
 *      -max      0           max
 *
 *   Within bounds → free movement
 *   Out of bounds → 2 modes:
 *     • during drag  : rubber-band effect (×0.3 damping)
 *     • on release   : animated snap-back (300ms)
 *
 * Reset: when scale returns to 1, position resets to (0, 0).
 *
 * @param {Function} clickCallback - Called when a click (not a drag) is detected on the image
 * @param {import('vue').Ref<HTMLElement>} wrapperRef - Template ref of the image wrapper element
 */
export default function useImageZoom(clickCallback, wrapperRef) {
    // --- Reactive state ---

    const scale = ref(MINSCALE),
        pointX = ref(0),
        pointY = ref(0),
        isDragging = ref(false),
        isSnapping = ref(false), // True during snap-back animation (triggers CSS transition)
        isZooming = ref(false); // True during animated zoom-to-point (triggers longer CSS transition)

    // --- Internal state ---

    const DAMPING = 0.3; // Rubber-band resistance factor (0 = hard stop, 1 = no resistance)

    let panning = false,
        start = { x: 0, y: 0 },
        mouseDownPos = { x: 0, y: 0 }, // Mouse position at mousedown to distinguish click vs drag
        initialDistance = 0, // Initial distance between two touch points (pinch-zoom)
        initialScale = MINSCALE,
        pinchImgPoint = { x: 0, y: 0 }, // Image point under initial pinch midpoint
        pinchOriginCenter = { x: 0, y: 0 }; // Wrapper's untransformed center (fixed during gesture)

    // --- Computed ---

    const transformStyle = computed(() => {
        return {
            transform: `translate(${pointX.value}px, ${pointY.value}px) scale(${scale.value})`,
        };
    });

    // --- Pure utilities ---

    // Applies dampening when value exceeds [min, max] range
    function dampen(value, min, max) {
        if (value < min) return min + (value - min) * DAMPING;
        if (value > max) return max + (value - max) * DAMPING;
        return value;
    }

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

    // --- Bounds clamping & rubber-band effect ---

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
            maxX: (w * (scale.value - 1)) / 2,
            maxY: (h * (scale.value - 1)) / 2,
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

    // Animates the image back to bounds on release (activates CSS transition via isSnapping)
    function snapBack() {
        const bounds = getBounds();
        if (!bounds) return;
        const outOfBounds = pointX.value < -bounds.maxX || pointX.value > bounds.maxX || pointY.value < -bounds.maxY || pointY.value > bounds.maxY;
        if (outOfBounds) {
            isSnapping.value = true;
            clampPosition();
            setTimeout(() => {
                isSnapping.value = false;
            }, 300);
        }
    }

    // --- Actions ---

    function resetTransform() {
        scale.value = MINSCALE;
        pointX.value = 0;
        pointY.value = 0;
    }

    /**
     * Animates zoom to center on a specific point (e.g. polygon center on correct answer).
     * @param {number} centerX - Target X in displayed image coordinates
     * @param {number} centerY - Target Y in displayed image coordinates
     * @param {number} targetScale - Zoom level to animate to (default 3)
     * @param {number} duration - Animation duration in ms (default 800)
     * @returns {Promise} Resolves when animation completes
     */
    function animateZoomTo(centerX, centerY, targetScale = 10, duration = 1600) {
        return new Promise((resolve) => {
            isZooming.value = true;
            const wrapper = wrapperRef.value;
            const wrapperW = wrapper.offsetWidth;
            const wrapperH = wrapper.offsetHeight;
            // With transform-origin: center, to center point (cx,cy) in viewport:
            // tx = (w/2 - cx) * scale,  ty = (h/2 - cy) * scale
            pointX.value = (wrapperW / 2 - centerX) * targetScale;
            pointY.value = (wrapperH / 2 - centerY) * targetScale;
            scale.value = targetScale;
            setTimeout(() => {
                isZooming.value = false;
                resolve();
            }, duration);
        });
    }

    // --- Mouse event handlers ---

    function onMouseDown(e) {
        e.preventDefault();
        start = { x: e.clientX - pointX.value, y: e.clientY - pointY.value };
        panning = true;
        isDragging.value = true;
        mouseDownPos = { x: e.clientX, y: e.clientY };
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

    function onMouseUp(e) {
        panning = false;
        isDragging.value = false;
        snapBack();

        if (!e.target.classList.contains('oea-img')) {
            return;
        }

        // If mouse barely moved from mousedown, it's a click (not a drag) — trigger callback
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (dx * dx + dy * dy < 25) {
            clickCallback(e);
        }
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
            panning = false;
            initialDistance = getDistance(e.touches);
            initialScale = scale.value;

            const rect = wrapperRef.value.getBoundingClientRect();
            const w = wrapperRef.value.offsetWidth;
            const h = wrapperRef.value.offsetHeight;
            const mid = getMidPoint(e.touches);

            // Image point under the midpoint of the two fingers
            pinchImgPoint = {
                x: (mid.x - rect.x) / initialScale,
                y: (mid.y - rect.y) / initialScale,
            };
            // Wrapper's untransformed center (stays fixed during the gesture)
            pinchOriginCenter = {
                x: rect.x + w * initialScale / 2 - pointX.value,
                y: rect.y + h * initialScale / 2 - pointY.value,
            };
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (panning && e.touches.length === 1) {
            pointX.value = e.touches[0].clientX - start.x;
            pointY.value = e.touches[0].clientY - start.y;
            dampenPosition();
        } else if (e.touches.length === 2) {
            const currentDistance = getDistance(e.touches);
            const newScale = Math.min(Math.max(initialScale * currentDistance / initialDistance, MINSCALE), MAXSCALE);
            const currentMid = getMidPoint(e.touches);
            const w = wrapperRef.value.offsetWidth;
            const h = wrapperRef.value.offsetHeight;

            // Adjust translation so the image point under the initial midpoint
            // stays under the current midpoint as scale changes
            pointX.value = currentMid.x - pinchOriginCenter.x + w * newScale / 2 - pinchImgPoint.x * newScale;
            pointY.value = currentMid.y - pinchOriginCenter.y + h * newScale / 2 - pinchImgPoint.y * newScale;
            scale.value = newScale;
            clampPosition();
        }
    }

    function onTouchEnd() {
        panning = false;
        isDragging.value = false;
        snapBack(); // Animate back to bounds if overscrolled
    }

    // --- Watchers ---

    // Auto-reset position when zoom returns to 1x
    watch(scale, (value) => {
        if (value == MINSCALE) {
            resetTransform();
        }
    });

    // --- Public API ---

    return {
        isDragging,
        isSnapping,
        isZooming,
        transformStyle,
        resetTransform,
        animateZoomTo,
        onMouseDown,
        onMouseUp,
        onMouseMove,
        onWheel,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    };
}
