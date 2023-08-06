import { ref, computed, watch } from 'vue';

export default function useImageZoom(clikcCallback) {

    const scale = ref(1),
        pointX = ref(0),
        pointY = ref(0);
    let panning = false,
        start = { x: 0, y: 0 },
        pointSaved = { x: 0, y: 0 };

    const transformStyle = computed(() => {
        return {
            transform: `translate(${pointX.value}px, ${pointY.value}px) scale(${scale.value})`,
        };
    });

    function resetTransform() {
        scale.value = 1;
        pointX.value = 0;
        pointY.value = 0;
    }

    function onMouseDown(e) {
        e.preventDefault();
        start = { x: e.clientX - pointX.value, y: e.clientY - pointY.value };
        panning = true;
        pointSaved = { x: pointX.value, y: pointY.value };
    }

    function onMouseUp(e) {
        panning = false;

        //Check if is a click or a drag
        if (pointSaved.x == pointX.value && pointSaved.y == pointY.value) {
            clikcCallback(e);
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

        const threshold = 10 * scale.value;
        if (xDifference < threshold && yDifference > -threshold && yDifference < threshold && yDifference > -threshold) {
            return;
        }

        pointX.value = newXValue;
        pointY.value = newYValue;
    }

    function onWheel(event) {
        event.preventDefault();

        const img = event.target;
        const rec = img.getBoundingClientRect();
        const x = (event.clientX - rec.x) / scale.value;
        const y = (event.clientY - rec.y) / scale.value;

        const delta = event.wheelDelta ? event.wheelDelta : -event.deltaY;

        if (scale.value == 1 && delta < 0) {
            resetTransform();
            return;
        }

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

        const m = delta > 0 ? 0.2 : -0.2;
        pointX.value += -x * m * 2 + img.offsetWidth * m;
        pointY.value += -y * m * 2 + img.offsetHeight * m;
    }

    //reset transform on scale reset
    watch(scale, (value) => {
        if (value == 1) {
            resetTransform();
        }
    });

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
    };
}
