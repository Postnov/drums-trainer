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
                                            {{ noteSymbols[instrument] }}
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

                    <!-- Громкость метронома -->
                    <div class="mt-6">
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-gray-700">
                                Громкость метронома
                            </label>
                            <span class="text-sm text-gray-500">
                                {{ Math.round(clickVolume * 100) }}%
                            </span>
                        </div>
                        <input 
                            type="range" 
                            v-model="clickVolume" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            class="volume-slider w-full" 
                            @input="setClickVolume(clickVolume)"
                        />
                    </div>
                </div>

                <!-- Выбор инструментов -->
                <div class="p-6 bg-gray-50 border-t border-gray-100">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Инструменты</h2>
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
                                <span class="note-symbol mr-2">{{ noteSymbols[instrument] }}</span>
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
import {
    createAudioContext,
    createSound,
    disposeAudioContext,
    setClickVolume as audioSetClickVolume
} from '../assets/audio.js';

/**
 * Настраиваемая задержка:
 * - Положительная (например, 0.05) = звук позже, чем анимация.
 * - Отрицательная (например, -0.05) = звук раньше, чем анимация.
 * - 0 = почти одновременно (с учётом планирования).
 */

// Количество отображаемых шагов (16 = 4 такта по 4 доли)
const BEATS_TO_SHOW = 16;
// Время, на которое мы планируем вперёд
const SCHEDULE_AHEAD_TIME = 0.1; // Уменьшаем время планирования
const CHECK_AHEAD_INTERVAL = 25; // Интервал проверки в миллисекундах

// Темп (BPM)
const tempo = ref(90);

// Флаг воспроизведения
const isPlaying = ref(false);
const currentBeat = ref(0);

// Аудиоконтекст, планирование
const audioContext = ref(null);
const nextNoteTime = ref(0);

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

// Символы
const noteSymbols = {
    rightHand: '👉',
    leftHand: '👈',
    rightFoot: '👟',
    leftFoot: '👞',
};

// Базовые паттерны (упрощенные)
const rhythmPatterns = {
    basic: {
        rightHand: [0, 4, 8, 12],
        leftHand: [2, 6, 10, 14],
        rightFoot: [0, 8],
        leftFoot: [4, 12]
    },
    alternate: {
        rightHand: [0, 4, 8, 12],
        leftHand: [2, 6, 10, 14],
        rightFoot: [0, 4, 8, 12],
        leftFoot: [2, 6, 10, 14]
    },
    syncopated: {
        rightHand: [0, 3, 6, 9],
        leftHand: [1, 4, 7, 10],
        rightFoot: [2, 5, 8, 11],
        leftFoot: [3, 6, 9, 12]
    }
};

// Флаг «Случайный ритм»
const isRandomPattern = ref(false);

// Текущее состояние паттернов
const currentPatterns = ref({ ...rhythmPatterns.rock });

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
            [0, 4, 8, 12], // Четверти
            [0, 2, 4, 6, 8, 10, 12, 14], // Восьмые
            [0, 3, 6, 9, 12, 15], // Триоли
        ],
        leftHand: [
            [2, 6, 10, 14], // Смещенные четверти
            [1, 3, 5, 7, 9, 11, 13, 15], // Смещенные восьмые
            [1, 4, 7, 10, 13], // Синкопы
        ],
        rightFoot: [
            [0, 8], // Половинные
            [0, 4, 8, 12], // Четверти
            [0, 3, 6, 9, 12, 15], // Триоли
        ],
        leftFoot: [
            [4, 12], // Смещенные половинные
            [2, 6, 10, 14], // Смещенные четверти
            [1, 5, 9, 13], // Синкопы
        ],
    };

    let pattern = new Set();
    
    // Выбираем базовую фигуру для всего паттерна
    const baseFigure = rhythmicFigures[instrument][
        Math.floor(Math.random() * rhythmicFigures[instrument].length)
    ];
    
    // Применяем базовую фигуру, но сдвигаем все ноты на один такт вперед
    baseFigure.forEach(beat => {
        // Сдвигаем все ноты на 4 бита вперед (пропускаем первый такт)
        const shiftedBeat = beat + 4;
        if (shiftedBeat < BEATS_TO_SHOW) {
            pattern.add(shiftedBeat);
        }
    });
    
    // Добавляем вариации (только в тактах 2-4)
    const addVariations = Math.random() < 0.4; // 40% шанс на вариации
    if (addVariations) {
        const variationMeasure = Math.floor(Math.random() * 3) + 1;
        const measureStart = variationMeasure * 4;
        
        pattern = new Set([...pattern].filter(beat => 
            beat < measureStart || beat >= measureStart + 4
        ));
        
        const variationFigure = rhythmicFigures[instrument][
            Math.floor(Math.random() * rhythmicFigures[instrument].length)
        ];
        
        variationFigure.forEach(beat => {
            const adjustedBeat = measureStart + (beat % 4);
            pattern.add(adjustedBeat);
        });
    }

    let result = Array.from(pattern);

    // Лимиты для разных конечностей
    const limits = {
        rightHand: { min: 2, max: 8 },
        leftHand: { min: 2, max: 8 },
        rightFoot: { min: 2, max: 6 },
        leftFoot: { min: 2, max: 6 }
    };

    while (result.length < limits[instrument].min) {
        const beat = baseFigure[Math.floor(Math.random() * baseFigure.length)];
        const measure = Math.floor(Math.random() * 3) + 1;
        const newBeat = measure * 4 + (beat % 4);
        if (!result.includes(newBeat)) {
            result.push(newBeat);
        }
    }
    
    while (result.length > limits[instrument].max) {
        const nonAccentedNotes = result.filter(beat => beat % 4 !== 0);
        if (nonAccentedNotes.length > 0) {
            const idx = result.indexOf(nonAccentedNotes[
                Math.floor(Math.random() * nonAccentedNotes.length)
            ]);
            result.splice(idx, 1);
        } else {
            const idx = Math.floor(Math.random() * result.length);
            result.splice(idx, 1);
        }
    }

    return result.sort((a, b) => a - b);
};

// Генерация паттерна для всех включённых инструментов
const updateRandomPatterns = () => {
    const newPatterns = {};
    
    // Генерируем для каждого активного инструмента независимо
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
        // Выбираем случайный стиль из rhythmPatterns
        const styles = Object.keys(rhythmPatterns);
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const base = { ...rhythmPatterns[randomStyle] };

        // Добавим маленькие вариации
        Object.keys(base).forEach(instr => {
            if (Math.random() < 0.3) {
                const rnd = Math.floor(Math.random() * 16);
                if (!base[instr].includes(rnd)) {
                    base[instr].push(rnd);
                    base[instr].sort((a, b) => a - b);
                }
            }
        });

        currentPatterns.value = base;
    }
};

// Проигрываем звуки
const scheduleNote = (beatNumber, time) => {
    if (!audioContext.value) return;

    // Инструменты
    for (const [instrument, pattern] of Object.entries(currentPatterns.value)) {
        if (activeInstruments[instrument] && pattern.includes(beatNumber)) {
            createSound(audioContext.value, instrument, time);
        }
    }
    // Метроном
    createSound(audioContext.value, 'click', time);
};

// Сдвигаем временную метку вперёд
const nextNote = () => {
    const secondsPerBeat = 60.0 / tempo.value;
    nextNoteTime.value += secondsPerBeat;
};

// Планировщик
const scheduler = () => {
    // Защита от множественных вызовов
    if (!isPlaying.value) return;

    const currentTime = audioContext.value.currentTime;
    
    // Планируем звуки только если нужно
    while (nextNoteTime.value < currentTime + SCHEDULE_AHEAD_TIME) {
        const currentBeatValue = currentBeat.value;
        const nextBeat = (currentBeatValue + 1) % BEATS_TO_SHOW;
        
        // Планируем звук с точным таймингом
        scheduleNote(nextBeat, nextNoteTime.value);

        // Планируем визуальное обновление
        const VISUAL_DELAY = 0.1; // Уменьшаем визуальную задержку
        const visualTime = nextNoteTime.value - currentTime + VISUAL_DELAY;
        
        setTimeout(() => {
            if (isPlaying.value) {
                currentBeat.value = nextBeat;
                
                // Генерируем новый паттерн только если дошли до начала
                if (nextBeat === 0 && isRandomPattern.value) {
                    updateRandomPatterns();
                }
            }
        }, visualTime * 1000);

        nextNote();
    }

    // Используем setTimeout вместо requestAnimationFrame для более точного тайминга
    setTimeout(scheduler, CHECK_AHEAD_INTERVAL);
};

// Старт
const startPlaying = async () => {
    try {
        if (!audioContext.value) {
            audioContext.value = await createAudioContext();
        }
        if (audioContext.value.state === 'suspended') {
            await audioContext.value.resume();
        }

        currentBeat.value = BEATS_TO_SHOW - 1; // Начинаем с последнего бита
        isPlaying.value = true;
        nextNoteTime.value = audioContext.value.currentTime;

        // Запускаем планировщик
        scheduler();
    } catch (error) {
        console.error('Error starting playback:', error);
    }
};

// Стоп
const stopPlaying = () => {
    isPlaying.value = false;
    currentBeat.value = 0;
};

// Тоггл
const togglePlaying = () => {
    if (isPlaying.value) {
        stopPlaying();
    } else {
        startPlaying();
    }
};

// При изменении темпа (на лету) — перезапустим
watch(tempo, () => {
    if (isPlaying.value) {
        stopPlaying();
        startPlaying();
    }
});

// Следим за "Случайным ритмом"
watch(isRandomPattern, (val) => {
    if (!val) {
        // Возвращаем "rock" по умолчанию
        currentPatterns.value = { ...rhythmPatterns.rock };
    } else {
        updateRandomPatterns();
    }
});

// Громкость метронома
const clickVolume = ref(0.3);
const setClickVolume = (vol) => {
    audioSetClickVolume(vol);
};

// Computed property для проверки активных инструментов
const isAnyInstrumentActive = computed(() => {
    return Object.values(activeInstruments).some(active => active);
});

// При размонтировании
onMounted(() => { });
onUnmounted(() => {
    stopPlaying();
    disposeAudioContext();
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

    .volume-slider {
        @apply h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
    }

    .volume-slider::-webkit-slider-thumb {
        @apply appearance-none w-4 h-4 bg-gray-600 rounded-full cursor-pointer
        hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
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
}
</style>
