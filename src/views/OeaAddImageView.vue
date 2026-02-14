<template>
    <div class="admin-view-wrapper">
        <div class="container">
        <Stepper :value="activeStep" linear class="stepper">
            <StepList>
                <Step value="1">Upload Image</Step>
                <Step value="2">Adjust Dimensions</Step>
                <Step value="3">Draw Polygon</Step>
                <Step value="4">Download & JSON</Step>
            </StepList>

            <StepPanels>
                <!-- Step 1: Image Upload -->
                <StepPanel value="1">
                    <div class="upload-container">
                        <div v-if="!imageLoaded && !loading" class="upload-area" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
                            <p>Drag & Drop or Click to Select an Image (JPG, PNG, HEIC)</p>
                            <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*,.heic" />
                        </div>
                        <div v-if="loading" class="loader">Loading...</div>
                    </div>
                </StepPanel>

                <!-- Step 2: Adjust Dimensions -->
                <StepPanel value="2">
                    <div v-if="imageLoaded" class="image-container">
                        <div class="dimension-toolbar">
                            <div class="dimension-inputs">
                                <label>
                                    Width
                                    <InputText type="number" v-model.number="displayWidth" @input="updateHeight" />
                                </label>
                                <label>
                                    Height
                                    <InputText type="number" v-model.number="displayHeight" @input="updateWidth" />
                                </label>
                            </div>
                            <SelectButton
                                :options="percentageOptions"
                                v-model="selectedPercentage"
                                @change="updateDimensions"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <img :src="imageSrc" :style="{ width: displayWidth + 'px', height: 'auto' }" alt="Uploaded Image" />
                    </div>
                    <div class="button-container">
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="previousStep" />
                        <Button label="Next" icon="pi pi-arrow-right" @click="nextStep" />
                    </div>
                </StepPanel>

                <!-- Step 3: Draw Polygon -->
                <StepPanel value="3">
                    <div v-if="imageLoaded" class="polygon-container">
                        <img :src="imageSrc" class="background-image" alt="Background Image" />
                        <canvas ref="canvas" class="canvas" @mousedown="startDragging" @mousemove="dragPoint" @mouseup="stopDragging"></canvas>
                    </div>
                    <div class="button-container">
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="previousStep" />
                        <Button label="Reset" severity="danger" icon="pi pi-refresh" @click="resetPolygon" />
                        <Button label="Next" icon="pi pi-arrow-right" @click="nextStep" />
                    </div>
                </StepPanel>

                <!-- Step 4: Download & JSON -->
                <StepPanel value="4">
                    <div class="download-container">
                        <div class="input-fields">
                            <label>
                                Image ID:
                                <InputText v-model="imageId" placeholder="Enter image ID" />
                            </label>
                            <label>
                                Difficulty Level:
                                <SelectButton :options="difficultyOptions" v-model="difficultyLevel" optionLabel="label" optionValue="value" />
                            </label>
                        </div>
                        <div class="json-output">
                            <div class="json-container">
                                <Button v-if="imageId != null && difficultyLevel != null" icon="pi pi-copy" class="copy-button" @click="copyJsonOutput" />
                                <pre>{{ jsonOutput }}</pre>
                            </div>
                        </div>
                        <Button label="Download Image" icon="pi pi-download" @click="downloadImage" />
                    </div>
                    <div class="button-container">
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="previousStep" />
                    </div>
                </StepPanel>
            </StepPanels>
        </Stepper>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import heic2any from 'heic2any';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const activeStep = ref('1');
const imageLoaded = ref(false);
const loading = ref(false);
const fileInput = ref(null);
const imageSrc = ref('');
const originalWidth = ref(0);
const originalHeight = ref(0);
const displayWidth = ref(0);
const displayHeight = ref(0);
let aspectRatio = 1;
const pointRadius = 5;
const polygonPoints = ref([]);
const selectedPercentage = ref(100);
const percentageOptions = [
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
];
const imageId = ref();
const difficultyLevel = ref(0);
const difficultyOptions = [
    { label: '0', value: 0 },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
];

const jsonOutput = computed(() => {
    const coords = polygonPoints.value.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(',');
    return JSON.stringify(
        {
            id: imageId.value,
            url: `/images/${imageId.value}.jpg`,
            coords: coords,
            width: displayWidth.value,
            height: displayHeight.value,
            difficultyLevel: difficultyLevel.value,
        },
        null,
        2,
    );
});

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await processFile(file);
};

const handleDrop = async (event) => {
    const file = event.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
};

const triggerFileInput = () => {
    fileInput.value.click();
};

const processFile = async (file) => {
    loading.value = true;

    if (file.type === 'image/heic') {
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
            });
            file = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                type: 'image/jpeg',
            });
        } catch (error) {
            console.error('HEIC conversion error:', error);
            loading.value = false;
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const image = new Image();
        image.src = e.target.result;
        image.onload = () => {
            originalWidth.value = image.width;
            originalHeight.value = image.height;
            displayWidth.value = image.width;
            displayHeight.value = image.height;
            aspectRatio = image.width / image.height;
            imageSrc.value = e.target.result;
            imageLoaded.value = true;
            loading.value = false;
            nextStep(); // Move to the next step after processing
        };
    };
    reader.readAsDataURL(file);
};

const updateHeight = () => {
    displayHeight.value = Math.round(displayWidth.value / aspectRatio);
};

const updateWidth = () => {
    displayWidth.value = Math.round(displayHeight.value * aspectRatio);
};

const updateDimensions = () => {
    const scale = selectedPercentage.value / 100;
    displayWidth.value = Math.round(originalWidth.value * scale);
    displayHeight.value = Math.round(originalHeight.value * scale);
};

const nextStep = () => {
    const activeStepInt = parseInt(activeStep.value);
    activeStep.value = (activeStepInt + 1).toString();
    if (activeStep.value === '3') {
        drawImageOnCanvas();
    }
};

const previousStep = () => {
    const activeStepInt = parseInt(activeStep.value);
    activeStep.value = (activeStepInt - 1).toString();
};

watch(activeStep, (value, oldValue) => {
    if (value === '1') {
        resetImage();
    } else if (value === '2' && oldValue === '3') {
        resetPolygon();
    } else if (value === '3') {
        drawImageOnCanvas();
    }
});

const resetImage = () => {
    imageLoaded.value = false;
    imageSrc.value = '';
    originalWidth.value = 0;
    originalHeight.value = 0;
    displayWidth.value = 0;
    displayHeight.value = 0;
    polygonPoints.value = [];
};

const addPointIfNotDragging = (event) => {
    if (draggingPointIndex === null) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (displayWidth.value / rect.width);
        const y = (event.clientY - rect.top) * (displayHeight.value / rect.height);
        polygonPoints.value.push({ x, y });
        drawPolygon(); // Ensure the polygon is redrawn after adding a point
    }
};

const resetPolygon = () => {
    polygonPoints.value = [];
    const canvas = document.querySelector('.canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPolygon();
};

const drawImageOnCanvas = () => {
    const canvas = document.querySelector('.canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = displayWidth.value;
    canvas.height = displayHeight.value;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPolygon();
};

const drawPolygon = () => {
    const canvas = document.querySelector('.canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing

    // Draw the polygon
    if (polygonPoints.value.length > 1) {
        ctx.beginPath();
        ctx.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y);

        // Draw all segments
        for (let i = 1; i < polygonPoints.value.length; i++) {
            ctx.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y);
        }

        // Close the polygon if there are at least 3 points
        if (polygonPoints.value.length >= 3) {
            ctx.lineTo(polygonPoints.value[0].x, polygonPoints.value[0].y);
        }

        // Fill the polygon area
        ctx.fillStyle = 'rgba(102, 102, 102, 0.6)';
        ctx.fill();

        // Draw the polygon border
        ctx.strokeStyle = 'rgba(51, 51, 51, 0.6)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Draw all points
    polygonPoints.value.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // White with opacity
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; // Black border with opacity
        ctx.lineWidth = 4;
        ctx.stroke();
    });
};

let draggingPointIndex = null;

const startDragging = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (displayWidth.value / rect.width);
    const y = (event.clientY - rect.top) * (displayHeight.value / rect.height);

    // Check if the click is on a point
    let foundPoint = false;
    polygonPoints.value.forEach((point, index) => {
        const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        if (distance < pointRadius) {
            draggingPointIndex = index;
            foundPoint = true;
        }
    });
    if (!foundPoint) {
        addPointIfNotDragging(event);
    }
};

const dragPoint = (event) => {
    if (draggingPointIndex !== null) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (displayWidth.value / rect.width);
        const y = (event.clientY - rect.top) * (displayHeight.value / rect.height);

        polygonPoints.value[draggingPointIndex] = { x, y };
        drawPolygon();
    }
};

const stopDragging = () => {
    draggingPointIndex = null;
};

const downloadImage = () => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const image = new Image();
    image.src = imageSrc.value;
    image.onload = () => {
        tempCanvas.width = displayWidth.value;
        tempCanvas.height = displayHeight.value;
        tempCtx.drawImage(image, 0, 0, displayWidth.value, displayHeight.value);
        const link = document.createElement('a');
        link.href = tempCanvas.toDataURL('image/jpeg');
        link.download = `${imageId.value}.jpg`;
        link.click();
    };
};

const copyJsonOutput = () => {
    navigator.clipboard
        .writeText(jsonOutput.value)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Copied!', detail: 'JSON copied to clipboard', life: 3000 });
        })
        .catch((err) => {
            console.error('Could not copy text: ', err);
        });
};
</script>

<style scoped lang="scss">
// Wrapper pour éviter le warning Vue Transition
.admin-view-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
}

.container {
    display: flex;
    justify-content: center;
    padding: 2rem;
    min-height: 100vh;
    background: var(--bg-primary);
    position: relative;
    overflow: hidden;

    // Blobs flottants en arrière-plan
    &::before {
        content: '';
        position: absolute;
        width: 400px;
        height: 400px;
        top: -100px;
        right: -100px;
        background: var(--gradient-vibrant);
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        opacity: 0.2;
        filter: blur(60px);
        animation: float 25s ease-in-out infinite, morph 10s ease-in-out infinite;
        pointer-events: none;
    }

    &::after {
        content: '';
        position: absolute;
        width: 350px;
        height: 350px;
        bottom: -80px;
        left: -80px;
        background: var(--gradient-neon);
        border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
        opacity: 0.2;
        filter: blur(60px);
        animation: floatReverse 30s ease-in-out infinite, morph 12s ease-in-out infinite 2s;
        pointer-events: none;
    }

    .stepper {
        width: 100%;
        position: relative;
        z-index: 1;

        // Style du Stepper PrimeVue
        :deep(.p-stepper) {
            background: transparent;
        }

        :deep(.p-steplist) {
            background: rgba(26, 31, 58, 0.6);
            backdrop-filter: blur(20px);
            border-radius: var(--radius-lg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 10px 40px -10px var(--color-shadow);
        }

        :deep(.p-step) {
            .p-step-header {
                background: transparent;
                border-radius: var(--radius-md);
                padding: 0.75rem;
                transition: all var(--transition-base);

                &:hover {
                    background: rgba(139, 92, 246, 0.1);
                }
            }

            .p-step-number {
                background: var(--gradient-primary) !important;
                border: 2px solid rgba(255, 255, 255, 0.2) !important;
                color: white !important;
                font-weight: 700;
                width: 2.5rem;
                height: 2.5rem;
                font-size: 1.1rem;
                transition: all var(--transition-base);
                box-shadow: 0 4px 12px var(--glow-purple);
            }

            .p-step-title {
                color: var(--color-text-primary) !important;
                font-weight: 600;
                font-size: 1rem;
            }

            &.p-step-active {
                .p-step-number {
                    box-shadow:
                        0 6px 16px var(--glow-purple),
                        0 0 30px var(--glow-pink);
                    transform: scale(1.1);
                }

                .p-step-title {
                    background: var(--gradient-vibrant);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            }
        }

        :deep(.p-steppanels) {
            background: transparent;
        }

        :deep(.p-steppanel) {
            background: rgba(26, 31, 58, 0.4) !important;
            backdrop-filter: blur(20px);
            border-radius: var(--radius-lg);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            box-shadow: 0 10px 40px -10px var(--color-shadow);
        }

        :deep(.p-steppanel-content) {
            padding: 0;
        }
    }

    .upload-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 15rem;
        position: relative;

        .upload-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 25rem;
            height: 15rem;
            border: 3px dashed rgba(139, 92, 246, 0.5);
            border-radius: var(--radius-lg);
            padding: 2rem;
            text-align: center;
            background: rgba(26, 31, 58, 0.6);
            backdrop-filter: blur(20px);
            cursor: pointer;
            transition: all var(--transition-base);
            box-shadow:
                0 10px 40px -10px var(--glow-purple),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset;

            &:hover {
                border-color: var(--color-purple);
                transform: translateY(-4px);
                box-shadow:
                    0 20px 60px -10px var(--glow-purple),
                    0 0 40px var(--glow-pink),
                    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
            }

            p {
                font-size: 1.1rem;
                color: var(--color-text-primary);
                font-weight: 500;
            }

            input[type='file'] {
                display: none;
            }
        }

        .loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.25rem;
            font-weight: 600;
            background: var(--gradient-vibrant);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: pulse 2s ease-in-out infinite;
        }
    }

    .image-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: rgba(26, 31, 58, 0.4);
        backdrop-filter: blur(20px);
        border-radius: var(--radius-lg);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 40px -10px var(--color-shadow);

        img {
            height: auto;
            max-width: 100%;
            border-radius: var(--radius-md);
            box-shadow: 0 8px 24px var(--color-shadow-lg);
        }
    }

    .dimension-toolbar {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
        padding: 1rem 1.5rem;
        width: 100%;
        background: rgba(26, 31, 58, 0.6);
        backdrop-filter: blur(20px);
        border-radius: var(--radius-md);
        border: 1px solid rgba(255, 255, 255, 0.1);

        .dimension-inputs {
            display: flex;
            gap: 1rem;
            align-items: center;

            label {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: var(--color-text-primary);
                font-weight: 600;
                white-space: nowrap;

                input {
                    width: 5rem;
                }
            }
        }

        :deep(.p-selectbutton) {
            .p-button {
                padding: 0.5rem 1rem !important;
            }
        }
    }

    .polygon-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: rgba(26, 31, 58, 0.4);
        backdrop-filter: blur(20px);
        border-radius: var(--radius-lg);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 40px -10px var(--color-shadow);

        .background-image {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 0;
            width: 100%;
            height: auto;
            border-radius: var(--radius-lg);
        }

        .canvas {
            border: 2px solid rgba(139, 92, 246, 0.3);
            border-radius: var(--radius-md);
            width: 100%;
            z-index: 1;
            cursor: crosshair;
            transition: border-color var(--transition-base);

            &:hover {
                border-color: var(--color-purple);
            }
        }
    }

    .download-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;

        .input-fields {
            display: flex;
            gap: 2rem;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem 1.5rem;
            background: rgba(26, 31, 58, 0.6);
            backdrop-filter: blur(20px);
            border-radius: var(--radius-md);
            border: 1px solid rgba(255, 255, 255, 0.1);

            label {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: var(--color-text-primary);
                font-weight: 600;
                white-space: nowrap;

                input {
                    min-width: 8rem;
                }
            }

            :deep(.p-selectbutton) {
                .p-button {
                    padding: 0.5rem 1rem !important;
                    min-width: 3rem;
                }
            }
        }

        .json-output {
            margin-block: 1rem;
            text-align: left;
            width: 100%;

            .json-container {
                position: relative;
                background: rgba(26, 31, 58, 0.8);
                backdrop-filter: blur(20px);
                border-radius: var(--radius-md);
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;

                .copy-button {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    z-index: 10;
                    background: var(--gradient-primary) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    transition: all var(--transition-base);

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow:
                            0 6px 16px var(--glow-purple),
                            0 0 30px var(--glow-pink) !important;
                    }
                }

                pre {
                    background-color: transparent;
                    color: var(--color-text-primary);
                    padding: 1.5rem;
                    margin: 0;
                    font-family: 'Courier New', monospace;
                    font-size: 0.95rem;
                    line-height: 1.6;
                }
            }
        }
    }

    .button-container {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        justify-content: space-between;
        flex-wrap: wrap;

        :deep(.p-button) {
            position: relative;
            font-size: 1.1rem !important;
            padding: 1rem 2rem !important;
            min-width: 10rem;
            font-weight: 600;
            transition: all var(--transition-base) !important;
            overflow: hidden;

            // Shimmer overlay
            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.2) 50%,
                    transparent 100%
                );
                transition: left var(--transition-slow);
            }

            &:not([severity]):not([severity="secondary"]):not([severity="danger"]) {
                background: var(--gradient-primary) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: white !important;
            }

            &:hover {
                transform: translateY(-4px) !important;

                &::before {
                    left: 100%;
                }
            }

            &:active {
                transform: translateY(-2px) !important;
            }
        }
    }

    // Désactiver animations si préférence utilisateur
    @media (prefers-reduced-motion: reduce) {
        &::before,
        &::after {
            animation: none !important;
        }

        .button-container :deep(.p-button) {
            &::before {
                display: none;
            }
        }
    }
}
</style>
