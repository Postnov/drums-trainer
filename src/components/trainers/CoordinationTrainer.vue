<template>
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
                    <div v-for="line in 5" :key="`staff-${line}`" class="absolute w-full h-[1px] bg-gray-200"
                        :style="{ top: `${(line - 1) * 40}px` }"></div>

                    <!-- Вертикальные разделители тактов -->
                    <div class="absolute inset-0 grid"
                        :style="{ gridTemplateColumns: `repeat(${BEATS_TO_SHOW}, 1fr)` }">
                        <div v-for="beat in BEATS_TO_SHOW" :key="`bar-${beat}`" class="border-l" :class="{
                            'border-gray-300': (beat - 1) % 4 !== 0,
                            'border-gray-400 border-l-2': (beat - 1) % 4 === 0
                        }"></div>
                    </div>

                    <!-- Ноты (иконки конечностей) -->
                    <div v-for="beatIndex in BEATS_TO_SHOW" :key="`beat-${beatIndex}`" class="absolute h-full" :style="{
                        left: `${(beatIndex - 1) * (100 / BEATS_TO_SHOW)}%`,
                        width: '2px'
                    }">
                        <template v-for="(pattern, instrument) in currentPatterns"
                            :key="`note-${instrument}-${beatIndex}`">
                            <div v-if="activeInstruments[instrument] && pattern.includes(beatIndex - 1)"
                                class="absolute flex items-center justify-center w-6 h-6 transition-all duration-150"
                                :class="{
                                    'scale-110': currentBeat === beatIndex - 1
                                }" :style="{
                                    top: `${getInstrumentPosition(instrument) - 12}px`,
                                    left: '-12px'
                                }">
                                <span class="note-symbol" :class="{
                                    'text-blue-500': currentBeat === beatIndex - 1,
                                    'text-gray-800': currentBeat !== beatIndex - 1
                                }">
                                    <img :src="noteSymbols[instrument]" :alt="instrumentNames[instrument]"
                                        class="limb-icon" />
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
                        <input type="range" v-model="tempo" min="40" max="200" step="1" class="tempo-slider w-full" />
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>40</span>
                            <span>120</span>
                            <span>200</span>
                        </div>
                    </div>
                </div>

                <!-- Кнопки управления -->
                <div class="flex gap-3">
                    <button @click="generateNewPattern" class="btn-secondary" :disabled="!isAnyInstrumentActive">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                clip-rule="evenodd" />
                        </svg>
                        <span>Новый ритм</span>
                    </button>

                    <button @click="togglePlaying" class="btn-primary" :disabled="!isAnyInstrumentActive">
                        <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clip-rule="evenodd" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clip-rule="evenodd" />
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
                <input type="range" v-model="clickVolume" min="0" max="1" step="0.1" class="volume-slider w-full"
                    @input="setClickVolume(clickVolume)" />
            </div>
        </div>

        <!-- Выбор конечностей -->
        <div class="p-6 bg-gray-50 border-t border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Конечности</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="(active, instrument) in activeInstruments" :key="instrument"
                    class="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex-shrink-0">
                        <input type="checkbox" :id="instrument" v-model="activeInstruments[instrument]"
                            class="instrument-checkbox" />
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
                    <input type="checkbox" id="randomPattern" v-model="isRandomPattern" class="instrument-checkbox" />
                    <label for="randomPattern" class="cursor-pointer flex-1">
                        <div class="font-medium text-gray-900">
                            Случайный ритм каждые 4 такта
                        </div>
                        <div class="text-sm text-gray-500 mt-1">
                            Автоматически генерирует новый ритм каждые 4 такта
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <!-- Контакты -->
        <div class="p-6 bg-gray-50 border-t border-gray-100">
            <div class="text-center text-sm text-gray-600">
                <p class="font-medium">Даниил Постнов</p>
                <div class="mt-2 space-x-4">
                    <a href="https://t.me/danya_postnov" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="text-blue-600 hover:text-blue-700 hover:underline">
                        Телеграм: t.me/danya_postnov
                    </a>
                    <span class="text-gray-400">|</span>
                    <a href="https://dev-postnov" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="text-blue-600 hover:text-blue-700 hover:underline">
                        Сайт: dev-postnov
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed, defineExpose } from 'vue';
import {
    createAudioContext,
    createSound,
    disposeAudioContext,
    setClickVolume as audioSetClickVolume
} from '../../assets/audio.js';

// Иконки конечностей (замените пути, если у вас другие)
import rightHandIcon from '../../assets/legs-hands-icons/hand-right-icon.png';
import leftHandIcon from '../../assets/legs-hands-icons/hand-left-icon.png';
import rightFootIcon from '../../assets/legs-hands-icons/leg-right-icon.svg';
import leftFootIcon from '../../assets/legs-hands-icons/leg-left-icon.svg';

// Количество отображаемых шагов
const BEATS_TO_SHOW = 16;
// Время планирования вперёд (сек.)
const SCHEDULE_AHEAD_TIME = 0.1;
// Как часто проверяем (мс)
const CHECK_AHEAD_INTERVAL = 25;

// Темп (BPM)
const tempo = ref(90);

// Флаги
const isPlaying = ref(false);
const currentBeat = ref(0);
const isRandomPattern = ref(true);

// Аудиоконтекст
const audioContext = ref(null);
const nextNoteTime = ref(0);

// Метроном
const clickVolume = ref(0.3);

// Базовые паттерны (нерандомный режим)
const rhythmPatterns = {
    basic: {
        rightHand: [0, 4, 8, 12],
        leftHand: [0, 4, 8, 12],
        rightFoot: [0, 4, 8, 12],
        leftFoot: [0, 4, 8, 12]
    },
    alternate: {
        rightHand: [0, 4, 8, 12],
        leftHand: [2, 6, 10, 14],
        rightFoot: [0, 4, 8, 12],
        leftFoot: [2, 6, 10, 14]
    },
    paradiddle: {
        rightHand: [0, 2, 4, 6, 8, 10, 12, 14],
        leftHand: [1, 3, 5, 7, 9, 11, 13, 15],
        rightFoot: [0, 4, 8, 12],
        leftFoot: [2, 6, 10, 14]
    }
};

// Текущее состояние паттернов
const currentPatterns = ref({ ...rhythmPatterns.basic });

// Какие конечности активны
const activeInstruments = reactive({
    rightHand: true,
    leftHand: true,
    rightFoot: true,
    leftFoot: true,
});

// Названия
const instrumentNames = {
    rightHand: 'Правая рука',
    leftHand: 'Левая рука',
    rightFoot: 'Правая нога',
    leftFoot: 'Левая нога',
};

// Иконки
const noteSymbols = {
    rightHand: rightHandIcon,
    leftHand: leftHandIcon,
    rightFoot: rightFootIcon,
    leftFoot: leftFootIcon,
};

// Маппинг конечностей -> звуки барабанов
const limbToSoundMap = {
    rightHand: 'ride',
    leftHand: 'snare',
    rightFoot: 'kick',
    leftFoot: 'hihat',
};

// Позиция инструмента (по вертикали)
const getInstrumentPosition = (instrument) => {
    const positions = {
        rightHand: 40,
        leftHand: 80,
        rightFoot: 120,
        leftFoot: 160,
    };
    return positions[instrument];
};

// Проверяем, есть ли хоть один активный инструмент
const isAnyInstrumentActive = computed(() => {
    return Object.values(activeInstruments).some(active => active);
});

// Устанавливаем громкость клика
const setClickVolume = (vol) => {
    audioSetClickVolume(vol);
};

/**
 * Генерация случайного паттерна для одной конечности:
 * более расширенный и разнообразный, чем базовый,
 * чтобы не было однообразия
 */
const generateRandomPattern = (limb) => {
    const pattern = new Set();

    // Пример более продвинутых ритмических заготовок
    const basePatterns = {
        rightHand: [
            [0, 4, 8, 12], [2, 6, 10, 14], [1, 5, 9, 13],
            [0, 2, 3, 4, 8, 10], [0, 1, 2, 4, 5, 7],
            [6, 7, 14, 15], [0, 8], [2, 3, 5, 10, 13]
        ],
        leftHand: [
            [1, 3, 5, 7], [0, 4, 8, 12], [2, 6, 10, 14],
            [1, 2, 5, 6, 9, 11], [4, 5, 10, 11, 14, 15],
            [0, 2, 10], [3, 7, 9, 13], [2, 3, 4, 6, 9, 12]
        ],
        rightFoot: [
            [0, 8], [0, 4, 8, 12], [2, 6, 10, 14],
            [0, 3, 8, 11], [0, 2, 4, 10], [4, 8, 12],
            [0, 5, 10, 13], [2, 7, 9, 14]
        ],
        leftFoot: [
            [4, 12], [1, 5, 9, 13], [2, 6, 10, 14],
            [0, 8], [3, 7, 11, 15], [2, 10],
            [0, 8, 12], [4, 8, 12, 14]
        ]
    };

    // Выбираем 1-2 случайные заготовки для limb
    const randomCount = Math.floor(Math.random() * 2) + 1;
    const possibleBases = [...basePatterns[limb]];

    for (let i = 0; i < randomCount; i++) {
        if (!possibleBases.length) break;
        const randIndex = Math.floor(Math.random() * possibleBases.length);
        const chosen = possibleBases.splice(randIndex, 1)[0];

        chosen.forEach(beat => {
            if (Math.random() < 0.9) { // 90% шанс взять ноту из базы
                pattern.add(beat);
            }
        });
    }

    // Дополнительные случайные ноты
    for (let i = 0; i < BEATS_TO_SHOW; i++) {
        if (Math.random() < 0.1) {
            pattern.add(i);
        }
    }

    // Добавляем синкопы
    const syncopationCount = Math.floor(Math.random() * 3); // 0..2
    for (let i = 0; i < syncopationCount; i++) {
        const syncBeat = [1, 3, 5, 7, 9, 11, 13, 15];
        pattern.add(syncBeat[Math.floor(Math.random() * syncBeat.length)]);
    }

    // Ограничиваем минимум/максимум
    const limits = {
        rightHand: { min: 3, max: 12 },
        leftHand: { min: 2, max: 10 },
        rightFoot: { min: 1, max: 6 },
        leftFoot: { min: 1, max: 6 }
    };

    // Добавим, если меньше минимума
    while (pattern.size < limits[limb].min) {
        pattern.add(Math.floor(Math.random() * BEATS_TO_SHOW));
    }
    // Уберем лишние, если больше максимума
    while (pattern.size > limits[limb].max) {
        const arr = Array.from(pattern);
        pattern.delete(arr[Math.floor(Math.random() * arr.length)]);
    }

    return Array.from(pattern).sort((a, b) => a - b);
};

// Генерация новых паттернов для всех включённых конечностей
const updateRandomPatterns = () => {
    const newPatterns = {};
    Object.keys(activeInstruments).forEach((limb) => {
        if (activeInstruments[limb]) {
            // Генерируем несколько раз и выбираем самый разнообразный паттерн
            let bestPattern = [];
            let maxVariety = -1;

            // Генерируем 3 варианта и выбираем лучший
            for (let i = 0; i < 3; i++) {
                const pattern = generateRandomPattern(limb);
                // Оцениваем разнообразие паттерна
                const variety = calculatePatternVariety(pattern);
                if (variety > maxVariety) {
                    maxVariety = variety;
                    bestPattern = pattern;
                }
            }
            newPatterns[limb] = bestPattern;
        }
    });
    currentPatterns.value = newPatterns;
};

// Функция для оценки разнообразия паттерна
const calculatePatternVariety = (pattern) => {
    if (pattern.length <= 1) return 0;
    
    let score = 0;
    
    // Оцениваем расстояния между нотами
    for (let i = 1; i < pattern.length; i++) {
        const gap = pattern[i] - pattern[i-1];
        // Небольшие расстояния (1-2) дают меньше очков
        // Средние расстояния (3-4) дают больше очков
        // Слишком большие расстояния (>4) дают меньше очков
        score += Math.min(gap, 8 - gap);
    }
    
    // Оцениваем распределение по тактам
    const measureCounts = new Array(4).fill(0);
    pattern.forEach(beat => {
        measureCounts[Math.floor(beat/4)]++;
    });
    
    // Добавляем очки за равномерное распределение по тактам
    const avgPerMeasure = pattern.length / 4;
    measureCounts.forEach(count => {
        score += (5 - Math.abs(count - avgPerMeasure));
    });
    
    return score;
};

// Кнопка "Новый ритм"
const generateNewPattern = () => {
    // Всегда используем updateRandomPatterns для генерации
    updateRandomPatterns();
};

// Следим за рандом-флагом
watch(isRandomPattern, (val) => {
    // Всегда используем updateRandomPatterns
    updateRandomPatterns();
});

// === ПЛАНИРОВЩИК ЗВУКА (только метроном? или хотим проигрывать звуки конечностей?) ===
// Для упрощения, вы в коде используете ТОЛЬКО метроном. 
// Если нужно, чтобы звучали "kick/snare/hihat/ride" при попадании на ноты, 
// нужно раскомментировать соответствующий вызов. Сейчас оставлю только метроном.

const scheduleNote = (beatNumber, time) => {
    if (!audioContext.value) return;
    // Метроном
    createSound(audioContext.value, 'click', time);

    // Если хотим звучание конечностей:
    /* 
    Object.entries(currentPatterns.value).forEach(([limb, pattern]) => {
        if (activeInstruments[limb] && pattern.includes(beatNumber)) {
            const soundType = limbToSoundMap[limb]; 
            createSound(audioContext.value, soundType, time);
        }
    });
    */
};

const nextNote = () => {
    const secondsPerBeat = 60.0 / tempo.value;
    nextNoteTime.value += secondsPerBeat;
};

// Планировщик
const scheduler = () => {
    if (!isPlaying.value) return;

    const currentTime = audioContext.value.currentTime;
    while (nextNoteTime.value < currentTime + SCHEDULE_AHEAD_TIME) {
        const cBeat = currentBeat.value;
        const nextBeat = (cBeat + 1) % BEATS_TO_SHOW;

        scheduleNote(nextBeat, nextNoteTime.value);

        // Время для визуальной задержки (пример)
        const VISUAL_DELAY = 0.08;
        const visualTime = nextNoteTime.value - currentTime + VISUAL_DELAY;

        setTimeout(() => {
            if (isPlaying.value) {
                currentBeat.value = nextBeat;

                // Если дошли до начала такта
                if (nextBeat === 0 && isRandomPattern.value) {
                    updateRandomPatterns();
                }
            }
        }, visualTime * 1000);

        nextNote();
    }

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
        currentBeat.value = BEATS_TO_SHOW - 1; // чтобы сразу перейти к 0
        isPlaying.value = true;
        nextNoteTime.value = audioContext.value.currentTime;
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

const togglePlaying = () => {
    if (isPlaying.value) {
        stopPlaying();
    } else {
        startPlaying();
    }
};

// Темп на лету
watch(tempo, () => {
    if (isPlaying.value) {
        stopPlaying();
        startPlaying();
    }
});

// Lifecycle
onMounted(() => { });
onUnmounted(() => {
    stopPlaying();
    disposeAudioContext();
});

// Экспортируем, если нужно, для родителя
defineExpose({
    stopPlaying
});
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
    .btn-primary {
        @apply inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow;
        width: 120px;
    }

    .btn-secondary {
        @apply inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 shadow-sm hover:shadow;
    }

    .tempo-slider {
        @apply h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer;
    }

    .tempo-slider::-webkit-slider-thumb {
        @apply appearance-none w-6 h-6 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow;
    }

    .volume-slider {
        @apply h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
    }

    .volume-slider::-webkit-slider-thumb {
        @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
    }

    .instrument-checkbox {
        @apply h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all duration-200;
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

    /* Тонировка иконок рук (зелёный) */
    .note-symbol img[src*="hand-"] {
        filter: brightness(0) saturate(100%) invert(68%) sepia(74%) saturate(385%) hue-rotate(67deg) brightness(95%) contrast(87%);
    }

    /* Тонировка иконок ног (красный) */
    .note-symbol img[src*="leg-"] {
        filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(118%) contrast(97%);
    }

    /* Активная (синяя) */
    .text-blue-500 .limb-icon {
        filter: brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(200deg) brightness(118%) contrast(119%);
    }
}
</style>
