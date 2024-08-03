import { ref, computed, watch } from 'vue';

// Define the default export function for the image zoom feature
export default function useImageZoom(clickCallback) {

    // Reactive variables to track the scale and position of the image
    const scale = ref(1),
        pointX = ref(0),
        pointY = ref(0);
    // Variables to track the panning state and positions
    let panning = false,
        start = { x: 0, y: 0 },
        pointSaved = { x: 0, y: 0 },
        initialDistance = 0,
        initialScale = 1;

    // Computed property to generate the transform style for the image
    const transformStyle = computed(() => {
        return {
            transform: `translate(${pointX.value}px, ${pointY.value}px) scale(${scale.value})`,
        };
    });

    // Function to reset the transform properties to their initial values
    function resetTransform() {
        scale.value = 1;
        pointX.value = 0;
        pointY.value = 0;
    }

    // Function to handle the mouse down event, initiating the panning
    function onMouseDown(e) {
        e.preventDefault();
        start = { x: e.clientX - pointX.value, y: e.clientY - pointY.value };
        panning = true;
        pointSaved = { x: pointX.value, y: pointY.value };
    }

    // Function to handle the mouse up event, stopping the panning
    function onMouseUp(e) {
        console.log('MOUSE UP');
        panning = false;

        // Check if the target is an image element
        if (!e.target.classList.contains('oea-img')) {
            return;
        }
        
        // Check if it's a click or a drag event
        if (pointSaved.x == pointX.value && pointSaved.y == pointY.value) {
            clickCallback(e);
        }
    }

    // Function to handle the mouse move event, updating the position of the image
    function onMouseMove(e) {
        e.preventDefault();
        if (!panning) {
            return;
        }

        // Calculate the new position values
        let newXValue = e.clientX - start.x;
        let newYValue = e.clientY - start.y;
        const xDifference = pointX.value + newXValue;
        const yDifference = pointY.value + newYValue;

        // Set a threshold to avoid small, unnecessary movements
        const threshold = 10 * scale.value;
        if (xDifference < threshold && yDifference > -threshold && yDifference < threshold && yDifference > -threshold) {
            return;
        }

        // Update the position values
        pointX.value = newXValue;
        pointY.value = newYValue;
    }

    // Function to handle the wheel event, updating the scale of the image
    function onWheel(event) {
        event.preventDefault();
        if (event.ctrlKey) {
            return;
        }

        const img = event.target;
        const rec = img.getBoundingClientRect();
        const x = (event.clientX - rec.x) / scale.value;
        const y = (event.clientY - rec.y) / scale.value;

        const delta = event.wheelDelta ? event.wheelDelta : -event.deltaY;

        // Reset transform if scale is 1 and wheel scrolled down
        if (scale.value == 1 && delta < 0) {
            resetTransform();
            return;
        }

        // Update scale value based on wheel scroll direction
        if (delta > 0) {
            if (scale.value > 10) {
                return;
            }
            scale.value = parseFloat((scale.value + 0.4).toFixed(1));
        } else {
            if (scale.value <= 1) {
                return;
            }
            scale.value = parseFloat((scale.value - 0.4).toFixed(1));
        }

        // Update the position values based on the scale change
        const m = delta > 0 ? 0.2 : -0.2;
        pointX.value += -x * m * 2 + img.offsetWidth * m;
        pointY.value += -y * m * 2 + img.offsetHeight * m;
    }

    // Handle touch events
    function onTouchStart(e) {
        console.log('touch start');
        
        if (e.touches.length === 1) {
            // Single touch: start panning
            start = { x: e.touches[0].clientX - pointX.value, y: e.touches[0].clientY - pointY.value };
            panning = true;
        } else if (e.touches.length === 2) {
            // Double touch: start zooming
            initialDistance = getDistance(e.touches);
            initialScale = scale.value;
        }
    }

    // Function to handle touch move event
    function onTouchMove(e) {
        e.preventDefault();
        if (panning && e.touches.length === 1) {
            // Handle panning
            let newXValue = e.touches[0].clientX - start.x;
            let newYValue = e.touches[0].clientY - start.y;
            pointX.value = newXValue;
            pointY.value = newYValue;
        } else if (e.touches.length === 2) {
            // Handle zooming
            const currentDistance = getDistance(e.touches);
            const scaleChange = currentDistance / initialDistance;
            scale.value = Math.min(Math.max(initialScale * scaleChange, 1), 10);
        }
    }

    // Function to handle touch end event
    function onTouchEnd(e) {
        panning = false;
    }

    // Utility function to calculate the distance between two touch points
    function getDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Watcher to reset transform when scale is reset to 1
    watch(scale, (value) => {
        if (value == 1) {
            resetTransform();
        }
    });

    // Return the reactive variables and event handling functions
    return {
        scale,
        pointX,
        pointY,
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
