<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-6xl mx-auto px-4">
            <!-- Header -->
            <header class="mb-8 text-center">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">
                    Тренажёр барабанщика
                </h1>
                <p class="text-gray-600">
                    Тренируйте координацию и ритм с помощью интерактивных упражнений
                </p>
            </header>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <!-- Нотный стан -->
                <div class="p-6">
                    <div class="relative border rounded-xl p-6 bg-white shadow-inner">
                        <!-- Таймлайн с числами -->
                        <div class="relative h-10 border-b border-gray-200 mb-4">
                            <div class="absolute inset-0 grid"
                                :style="{ gridTemplateColumns: `repeat(${BEATS_TO_SHOW}, 1fr)` }">
                                <div v-for="beat in BEATS_TO_SHOW" :key="beat" class="relative">
                                    <div class="absolute h-4 border-l" :class="{
                                        'border-gray-800': (beat - 1) % 4 === 0,
                                        'border-gray-200': (beat - 1) % 4 !== 0
                                    }"></div>
                                    <div class="absolute top-5 text-xs text-gray-600" :style="{ left: '-4px' }">
                                        {{ beat }}
                                    </div>
                                </div>
                            </div>

                            <!-- Курсор таймлайна -->
                            <div class="playhead absolute top-0 h-full bg-blue-500" :style="{
                                left: `${(currentBeat) * (100 / BEATS_TO_SHOW)}%`,
                                opacity: isPlaying ? 0.75 : 0.25
                            }"></div>
                        </div>

                        <div class="relative h-[200px]">
                            <!-- Горизонтальные линии нотного стана -->
                            <div v-for="line in 5" :key="`staff-${line}`" 
                                class="absolute w-full h-[1px] bg-gray-200"
                                :style="{ top: `${(line - 1) * 40}px` }">
                            </div>

                            <!-- Вертикальные разделители тактов -->
                            <div class="absolute inset-0 grid"
                                :style="{ gridTemplateColumns: `repeat(${BEATS_TO_SHOW}, 1fr)` }">
                                <div v-for="beat in BEATS_TO_SHOW" :key="`bar-${beat}`" 
                                    class="border-l" 
                                    :class="{
                                        'border-gray-300': (beat - 1) % 4 !== 0,
                                        'border-gray-400 border-l-2': (beat - 1) % 4 === 0
                                    }">
                                </div>
                            </div>

                            <!-- Ноты -->
                            <div v-for="beatIndex in BEATS_TO_SHOW" :key="`beat-${beatIndex}`" 
                                class="absolute h-full" 
                                :style="{
                                    left: `${(beatIndex - 1) * (100 / BEATS_TO_SHOW)}%`,
                                    width: '2px'
                                }">
                                <template v-for="(pattern, instrument) in currentPatterns"
                                    :key="`note-${instrument}-${beatIndex}`">
                                    <div v-if="activeInstruments[instrument] && pattern.includes(beatIndex - 1)"
                                        class="absolute flex items-center justify-center w-6 h-6 transition-all duration-150" 
                                        :class="{
                                            'scale-110': currentBeat === beatIndex - 1
                                        }"
                                        :style="{
                                            top: `${getInstrumentPosition(instrument) - 12}px`,
                                            left: '-12px'
                                        }">
                                        <span class="note-symbol" :class="{ 
                                            'text-blue-500': currentBeat === beatIndex - 1,
                                            'text-gray-800': currentBeat !== beatIndex - 1
                                        }">
                                            <img :src="noteSymbols[instrument]" :alt="instrumentNames[instrument]" class="limb-icon" />
                                        </span>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Основные контролы -->
                <div class="p-6 border-t border-gray-100">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <!-- Темп -->
                        <div class="flex-1 space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-medium text-gray-700">Темп</label>
                                <span class="text-2xl font-bold text-blue-600">{{ tempo }} BPM</span>
                            </div>
                            <div class="relative">
                                <input 
                                    type="range" 
                                    v-model="tempo" 
                                    min="40" 
                                    max="200" 
                                    step="1"
                                    class="tempo-slider w-full"
                                />
                                <div class="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>40</span>
                                    <span>120</span>
                                    <span>200</span>
                                </div>
                            </div>
                        </div>

                        <!-- Кнопки управления -->
                        <div class="flex gap-3">
                            <button
                                @click="generateNewPattern"
                                class="btn-secondary"
                                :disabled="!isAnyInstrumentActive"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                                </svg>
                                <span>Новый ритм</span>
                            </button>
                            <button
                                @click="togglePlaying"
                                class="btn-primary"
                                :disabled="!isAnyInstrumentActive"
                            >
                                <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                <span>{{ isPlaying ? 'Стоп' : 'Старт' }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Выбор инструментов -->
                <div class="p-6 bg-gray-50 border-t border-gray-100">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Конечности</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="(active, instrument) in activeInstruments" 
                            :key="instrument"
                            class="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div class="flex-shrink-0">
                                <input 
                                    type="checkbox" 
                                    :id="instrument" 
                                    v-model="activeInstruments[instrument]"
                                    class="instrument-checkbox"
                                />
                            </div>
                            <label :for="instrument" class="flex-1 flex items-center cursor-pointer">
                                <span class="note-symbol mr-2">
                                    <img :src="noteSymbols[instrument]" :alt="instrumentNames[instrument]" class="limb-icon" />
                                </span>
                                <span class="text-gray-700">{{ instrumentNames[instrument] }}</span>
                            </label>
                        </div>
                    </div>

                    <!-- Режим случайного ритма -->
                    <div class="mt-6 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-center space-x-3">
                            <input 
                                type="checkbox" 
                                id="randomPattern" 
                                v-model="isRandomPattern"
                                class="instrument-checkbox" 
                            />
                            <label for="randomPattern" class="cursor-pointer flex-1">
                                <div class="font-medium text-gray-900">Случайный ритм каждые 4 такта</div>
                                <div class="text-sm text-gray-500 mt-1">
                                    Автоматически генерирует новый ритм каждые 4 такта
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed } from 'vue';
import rightHandIcon from '../assets/legs-hands-icons/hand-right-icon.png';
import leftHandIcon from '../assets/legs-hands-icons/hand-left-icon.png';
import rightFootIcon from '../assets/legs-hands-icons/leg-right-icon.svg';
import leftFootIcon from '../assets/legs-hands-icons/leg-left-icon.svg';

// Количество отображаемых шагов (16 = 4 такта по 4 доли)
const BEATS_TO_SHOW = 16;

// Темп (BPM)
const tempo = ref(90);

// Флаг воспроизведения
const isPlaying = ref(false);
const currentBeat = ref(0);

// Выбор инструментов
const activeInstruments = reactive({
    rightHand: true,
    leftHand: true,
    rightFoot: true,
    leftFoot: true,
});

// Названия инструментов
const instrumentNames = {
    rightHand: 'Правая рука',
    leftHand: 'Левая рука',
    rightFoot: 'Правая нога',
    leftFoot: 'Левая нога',
};

// Иконки для конечностей
const noteSymbols = {
    rightHand: rightHandIcon,
    leftHand: leftHandIcon,
    rightFoot: rightFootIcon,
    leftFoot: leftFootIcon,
};

// Текст иконок
const iconText = {
    rightHand: 'back_hand',
    leftHand: 'back_hand',
    rightFoot: 'do_not_step',
    leftFoot: 'do_not_step',
};

// Базовые паттерны
const rhythmPatterns = {
    pattern1: {
        rightHand: [0, 0, 0, 0, 4, 4, 4, 4, 8, 8, 8, 8, 12, 12, 12, 12],
        leftHand: [2, 2, 2, 2, 6, 6, 6, 6, 10, 10, 10, 10, 14, 14, 14, 14],
        rightFoot: [0, 0, 0, 0, 4, 4, 4, 4, 8, 8, 8, 8, 12, 12, 12, 12],
        leftFoot: [2, 2, 2, 2, 6, 6, 6, 6, 10, 10, 10, 10, 14, 14, 14, 14]
    },
    pattern2: {
        rightHand: [0, 4, 8, 12, 2, 6, 10, 14],
        leftHand: [2, 6, 10, 14, 0, 4, 8, 12],
        rightFoot: [0, 4, 8, 12],
        leftFoot: [2, 6, 10, 14]
    },
    pattern3: {
        rightHand: [0, 2, 2, 2, 4, 6, 6, 6, 8, 10, 10, 10, 12, 14, 14, 14],
        leftHand: [2, 0, 0, 0, 6, 4, 4, 4, 10, 8, 8, 8, 14, 12, 12, 12],
        rightFoot: [0, 4, 8, 12],
        leftFoot: [2, 6, 10, 14]
    },
    pattern4: {
        rightHand: [0, 1, 2, 3, 4, 5, 6, 7],
        leftHand: [8, 9, 10, 11, 12, 13, 14, 15],
        rightFoot: [0, 2, 4, 6],
        leftFoot: [8, 10, 12, 14]
    }
};

// Флаг «Случайный ритм»
const isRandomPattern = ref(false);

// Текущее состояние паттернов
const currentPatterns = ref({ ...rhythmPatterns.pattern1 });

// Позиция инструмента по вертикали
const getInstrumentPosition = (instrument) => {
    const positions = {
        rightHand: 40,
        leftHand: 80,
        rightFoot: 120,
        leftFoot: 160,
    };
    return positions[instrument];
};

// Генерация случайного паттерна для конечности
const generateRandomPattern = (instrument) => {
    // Список базовых фигур для каждой конечности
    const rhythmicFigures = {
        rightHand: [
            [0, 2, 4, 6, 8, 10, 12, 14], // Восьмые
            [0, 1, 2, 3, 8, 9, 10, 11], // Плотная группа
            [0, 0, 4, 4, 8, 8, 12, 12], // Повторы
            [0, 2, 2, 2, 4, 6, 6, 6], // Акценты с повторами
        ],
        leftHand: [
            [2, 4, 6, 8, 10, 12, 14, 0], // Смещенные восьмые
            [4, 5, 6, 7, 12, 13, 14, 15], // Плотная группа смещенная
            [2, 2, 6, 6, 10, 10, 14, 14], // Повторы смещенные
            [2, 0, 0, 0, 6, 4, 4, 4], // Акценты с повторами смещенные
        ],
        rightFoot: [
            [0, 4, 8, 12], // Четверти
            [0, 2, 4, 6], // Первая половина плотная
            [0, 0, 4, 4, 8, 8, 12, 12], // С повторами
        ],
        leftFoot: [
            [2, 6, 10, 14], // Смещенные четверти
            [8, 10, 12, 14], // Вторая половина плотная
            [2, 2, 6, 6, 10, 10, 14, 14], // С повторами смещенные
        ],
    };

    const baseFigure = rhythmicFigures[instrument][
        Math.floor(Math.random() * rhythmicFigures[instrument].length)
    ];

    // Возвращаем фигуру целиком, без модификаций
    return [...baseFigure];
};

// Генерация паттерна для всех включённых инструментов
const updateRandomPatterns = () => {
    const newPatterns = {};
    Object.keys(activeInstruments).forEach(instrument => {
        if (activeInstruments[instrument]) {
            newPatterns[instrument] = generateRandomPattern(instrument);
        }
    });
    currentPatterns.value = newPatterns;
};

// Кнопка "Новый ритм"
const generateNewPattern = () => {
    if (isRandomPattern.value) {
        updateRandomPatterns();
    } else {
        const styles = Object.keys(rhythmPatterns);
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        currentPatterns.value = { ...rhythmPatterns[randomStyle] };
    }
};

// Создаем аудио контекст для метронома
const audioContext = ref(null);

// Функция для создания звука метронома
const createClickSound = async () => {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
};

// Функция для воспроизведения звука метронома
const playClick = () => {
    if (!audioContext.value) return;
    
    const oscillator = audioContext.value.createOscillator();
    const gainNode = audioContext.value.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.value.destination);
    
    oscillator.frequency.value = 1000;
    gainNode.gain.value = 0.1;
    
    const now = audioContext.value.currentTime;
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
};

// Обновление визуального состояния и воспроизведение метронома
const updateVisualState = () => {
    if (!isPlaying.value) return;
    
    currentBeat.value = (currentBeat.value + 1) % BEATS_TO_SHOW;
    playClick(); // Воспроизводим звук метронома
    
    if (currentBeat.value === 0 && isRandomPattern.value) {
        updateRandomPatterns();
    }
};

// Добавим ref для хранения текущего таймаута
const currentTimeout = ref(null);

// Старт
const startPlaying = () => {
    if (isPlaying.value) return;
    
    isPlaying.value = true;
    const interval = 60000 / tempo.value; // миллисекунды между битами
    
    function tick() {
        if (!isPlaying.value) return;
        
        updateVisualState();
        // Сохраняем ссылку на таймаут
        currentTimeout.value = setTimeout(tick, interval);
    }
    
    tick();
};

// Стоп
const stopPlaying = () => {
    isPlaying.value = false;
    currentBeat.value = 0;
    // Очищаем таймаут при остановке
    if (currentTimeout.value) {
        clearTimeout(currentTimeout.value);
        currentTimeout.value = null;
    }
};

// Тоггл
const togglePlaying = () => {
    if (isPlaying.value) {
        stopPlaying();
    } else {
        startPlaying();
    }
};

// При изменении темпа
watch(tempo, () => {
    if (isPlaying.value) {
        // Очищаем текущий таймаут перед перезапуском
        if (currentTimeout.value) {
            clearTimeout(currentTimeout.value);
            currentTimeout.value = null;
        }
        stopPlaying();
        startPlaying();
    }
});

// Следим за "Случайным ритмом"
watch(isRandomPattern, (val) => {
    if (!val) {
        currentPatterns.value = { ...rhythmPatterns.pattern1 };
    } else {
        updateRandomPatterns();
    }
});

// Computed property для проверки активных инструментов
const isAnyInstrumentActive = computed(() => {
    return Object.values(activeInstruments).some(active => active);
});

// При размонтировании
onMounted(async () => {
    await createClickSound();
});

onUnmounted(() => {
    stopPlaying();
    if (audioContext.value) {
        audioContext.value.close();
    }
});
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base styles */
@layer base {
    body {
        @apply antialiased bg-gray-50;
    }
}

/* Components */
@layer components {
    .btn-primary {
        @apply inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg 
        hover:bg-blue-700 focus:ring-0 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
        transition-all duration-200 shadow-sm hover:shadow;
        width: 120px;
    }

    .btn-secondary {
        @apply inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg 
        border border-gray-300 hover:bg-gray-50 focus:ring-0 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
        transition-all duration-200 shadow-sm hover:shadow;
    }

    .tempo-slider {
        @apply h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer;
    }

    .tempo-slider::-webkit-slider-thumb {
        @apply appearance-none w-6 h-6 bg-blue-600 rounded-full cursor-pointer 
        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200 shadow-sm hover:shadow;
    }

    .instrument-checkbox {
        @apply h-5 w-5 text-blue-600 rounded border-gray-300 
        focus:ring-blue-500 focus:ring-offset-0 cursor-pointer
        transition-all duration-200;
    }

    .playhead {
        @apply transition-all duration-75 ease-linear;
        will-change: transform;
        z-index: 10;
    }

    .note-symbol {
        @apply text-lg font-bold inline-flex items-center justify-center transition-all duration-150;
        width: 24px;
        height: 24px;
    }

    .limb-icon {
        @apply w-full h-full object-contain;
    }

    /* Стили для рук (зеленый) */
    .note-symbol img[src*="hand-"] {
        filter: brightness(0) saturate(100%) invert(68%) sepia(74%) 
            saturate(385%) hue-rotate(67deg) brightness(95%) contrast(87%);
    }

    /* Стили для ног (красный) */
    .note-symbol img[src*="leg-"] {
        filter: brightness(0) saturate(100%) invert(27%) sepia(51%) 
            saturate(2878%) hue-rotate(346deg) brightness(118%) contrast(97%);
    }

    /* Активные иконки (синий) */
    .text-blue-500 .limb-icon {
        filter: brightness(0) saturate(100%) invert(48%) sepia(79%) 
            saturate(2476%) hue-rotate(200deg) brightness(118%) contrast(119%);
    }
}
</style>
