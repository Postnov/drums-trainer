<template>
    <div class="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        <div class="space-y-6">
            <h1 class="text-center text-3xl font-bold text-gray-800">
                Тренажёр барабанщика
            </h1>

            <!-- Управление темпом и воспроизведением -->
            <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                    <div>
                        <span class="text-lg font-medium">Темп: {{ tempo }} BPM</span>
                        <input type="range" v-model="tempo" min="40" max="200" step="1"
                            class="tempo-slider w-full md:w-48 mt-1" />
                    </div>

                    <div class="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                        <button
                            class="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                            @click="generateNewPattern">
                            Новый ритм
                        </button>

                        <button class="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            @click="togglePlaying">
                            {{ isPlaying ? 'Стоп' : 'Старт' }}
                        </button>
                    </div>
                </div>

                <div class="flex flex-col space-y-2 mt-2">
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-600">Громкость метронома:</span>
                        <input type="range" v-model="clickVolume" min="0" max="1" step="0.1"
                            class="tempo-slider flex-grow" @input="setClickVolume(clickVolume)" />
                    </div>
                </div>
            </div>

            <!-- Выбор инструментов -->
            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div v-for="(active, instrument) in activeInstruments" :key="instrument"
                    class="flex items-center space-x-3">
                    <input type="checkbox" :id="instrument" v-model="activeInstruments[instrument]"
                        class="instrument-checkbox" />
                    <label :for="instrument" class="text-gray-700">
                        {{ instrumentNames[instrument] }}
                    </label>
                </div>

                <div class="flex items-center space-x-3 col-span-2 mt-2 pt-2 border-t">
                    <input type="checkbox" id="randomPattern" v-model="isRandomPattern" class="instrument-checkbox" />
                    <label for="randomPattern" class="text-gray-700">
                        Случайный ритм каждые 4 такта
                    </label>
                </div>
            </div>

            <!-- Нотный стан -->
            <div class="relative border rounded-lg p-6 bg-white font-mono shadow-inner">
                <!-- Таймлайн с числами -->
                <div class="relative h-10 border-b border-gray-300 mb-4">
                    <div class="absolute inset-0 grid"
                        :style="{ gridTemplateColumns: `repeat(${BEATS_TO_SHOW}, 1fr)` }">
                        <div v-for="beat in BEATS_TO_SHOW" :key="beat" class="relative">
                            <div class="absolute h-4 border-l" :class="{
                                'border-gray-800': (beat - 1) % 4 === 0,
                                'border-gray-300': (beat - 1) % 4 !== 0
                            }"></div>
                            <div class="absolute top-5 text-xs text-gray-600" :style="{ left: '-4px' }">
                                {{ beat }}
                            </div>
                        </div>
                    </div>

                    <!-- Курсор таймлайна -->
                    <div class="playhead absolute top-0 h-full" :style="{
                        left: `${(currentBeat) * (100 / BEATS_TO_SHOW)}%`
                    }"></div>
                </div>

                <div class="relative h-[200px]">
                    <!-- Горизонтальные линии нотного стана -->
                    <div v-for="line in 5" :key="`staff-${line}`" class="absolute w-full h-[1px] bg-gray-300"
                        :style="{ top: `${(line - 1) * 40}px` }"></div>

                    <!-- Горизонтальные линии для инструментов -->
                    <div v-for="(_, instrument) in instrumentNames" :key="`line-${instrument}`"
                        class="absolute w-full h-[1px] bg-gray-200"
                        :style="{ top: `${getInstrumentPosition(instrument)}px` }"></div>

                    <!-- Вертикальные разделители тактов -->
                    <div class="absolute inset-0 grid"
                        :style="{ gridTemplateColumns: `repeat(${BEATS_TO_SHOW}, 1fr)` }">
                        <div v-for="beat in BEATS_TO_SHOW" :key="`bar-${beat}`" class="border-l border-gray-300" :class="{
                            'border-l-2 border-gray-400': (beat - 1) % 4 === 0
                        }"></div>
                    </div>

                    <!-- Ноты -->
                    <div v-for="beatIndex in BEATS_TO_SHOW" :key="`beat-${beatIndex}`" class="absolute h-full" :style="{
                        left: `${(beatIndex - 1) * (100 / BEATS_TO_SHOW)}%`,
                        width: '2px'
                    }">
                        <template v-for="(pattern, instrument) in currentPatterns"
                            :key="`note-${instrument}-${beatIndex}`">
                            <div v-if="activeInstruments[instrument] && pattern.includes(beatIndex - 1)"
                                class="absolute flex items-center justify-center w-6 h-6" :style="{
                                    top: `${getInstrumentPosition(instrument) - 12}px`,
                                    left: '-12px'
                                }">
                                <span class="note-symbol" :class="{ 'text-blue-500': currentBeat === beatIndex - 1 }">
                                    {{ noteSymbols[instrument] }}
                                </span>
                            </div>
                        </template>
                    </div>

                    <!-- Курсор воспроизведения -->
                    <div class="playhead" :style="{
                        left: `${(currentBeat) * (100 / BEATS_TO_SHOW)}%`
                    }"></div>

                    <!-- Названия инструментов -->
                    <div class="absolute -left-36 h-full">
                        <div v-for="(name, instrument) in instrumentNames" :key="`label-${instrument}`"
                            class="absolute flex items-center space-x-2"
                            :style="{ top: `${getInstrumentPosition(instrument) - 8}px` }">
                            <span class="w-28 text-right text-gray-700">
                                {{ name.split(' ')[0] }}
                            </span>
                            <span class="note-symbol">
                                {{ noteSymbols[instrument] }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Легенда -->
            <div class="text-sm text-gray-600 mt-4 bg-gray-50 p-4 rounded-lg">
                <div class="font-medium mb-2">Обозначения:</div>
                <div class="grid grid-cols-2 gap-4">
                    <div v-for="(name, instrument) in instrumentNames" :key="instrument"
                        class="flex items-center space-x-2">
                        <span class="note-symbol">{{ noteSymbols[instrument] }}</span>
                        <span>- {{ name }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch } from 'vue';
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
const SCHEDULE_AHEAD_TIME = 0.5;

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
    kick: true,
    hihat: true,
    snare: true,
    ride: true,
});

// Названия инструментов
const instrumentNames = {
    kick: 'Бочка (правая нога)',
    hihat: 'Хай-хэт (левая нога)',
    snare: 'Малый барабан (левая рука)',
    ride: 'Райд (правая рука)',
};

// Символы
const noteSymbols = {
    kick: '●',
    hihat: '×',
    snare: '○',
    ride: '△',
};

// Базовые паттерны (в нерандомном режиме)
const rhythmPatterns = {
    rock: {
        kick: [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        ride: [0, 4, 8, 12]
    },
    funk: {
        kick: [0, 4, 7, 10],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        ride: [0, 3, 6, 9]
    },
    jazz: {
        kick: [0, 7, 10],
        snare: [4, 12, 14],
        hihat: [2, 6, 10, 14],
        ride: [0, 2, 4, 6, 8, 10, 12, 14]
    },
    latin: {
        kick: [0, 5, 8, 13],
        snare: [4, 12, 14],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        ride: [0, 3, 6, 8, 11, 14]
    }
};

// Флаг «Случайный ритм»
const isRandomPattern = ref(false);

// Текущее состояние паттернов
const currentPatterns = ref({ ...rhythmPatterns.rock });

// Позиция инструмента по вертикали
const getInstrumentPosition = (instrument) => {
    const positions = {
        ride: 40,
        snare: 80,
        hihat: 120,
        kick: 160,
    };
    return positions[instrument];
};

// Генерация более «случайного» паттерна для каждого инструмента
const generateRandomPattern = (instrument) => {
    // Список фигур (см. ваш код)
    const rhythmicFigures = {
        kick: [
            [0], [0, 2], [0, 3], [0, 2, 4], [0, 1, 2], [0, 3, 6],
            [0, 1, 3, 4], [0, 2, 3, 5], [1, 2, 3], [0, 1, 3, 5],
            [2, 3, 5, 6], [0, 2, 4, 6]
        ],
        snare: [
            [0], [0, 2], [0, 3], [0, 1], [0, 2, 3], [0, 1, 3],
            [0, 1, 2, 3], [1, 2, 3], [0, 2, 3, 5], [0, 1, 3, 4],
            [2, 3], [0, 1, 2]
        ],
        hihat: [
            [0, 2], [0, 1, 2, 3], [0, 2, 3], [0, 1, 3], [1, 3],
            [0, 1, 2], [0, 1, 2, 3, 4], [1, 2, 3, 4], [0, 2, 4, 6],
            [0, 1, 3, 4, 6], [1, 2, 4, 5], [0, 1, 3, 5]
        ],
        ride: [
            [0, 2], [0, 3], [0, 2, 4], [1, 3], [0, 1, 3],
            [0, 2, 3, 4], [0, 1, 2, 4, 5], [1, 2, 4, 5],
            [0, 2, 3, 5], [0, 1, 3, 4, 6], [2, 3, 5, 6], [0, 1, 2, 3, 5]
        ],
    };

    let pattern = new Set();

    // Генерация померно (4 такта)
    for (let measure = 0; measure < 4; measure++) {
        const measureStart = measure * 4;
        const figures = rhythmicFigures[instrument];

        // 1-3 случайных фигур
        const numFigures = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numFigures; i++) {
            const figure = figures[Math.floor(Math.random() * figures.length)];
            const offset = Math.floor(Math.random() * 2);
            figure.forEach(beat => {
                const adjustedBeat = measureStart + ((beat + offset) % 4);
                if (adjustedBeat < measureStart + 4) {
                    pattern.add(adjustedBeat);
                }
            });
        }

        // + одна случайная нота
        if (Math.random() < 0.4) {
            const randomBeat = measureStart + Math.floor(Math.random() * 4);
            pattern.add(randomBeat);
        }

        // Доп. правила
        if (instrument === 'hihat') {
            if (Math.random() < 0.3) {
                for (let i = measureStart; i < measureStart + 4; i++) {
                    if (Math.random() < 0.6) {
                        pattern.add(i);
                    }
                }
            }
        } else if (['kick', 'snare'].includes(instrument)) {
            if (Math.random() < 0.4) {
                pattern.add(measureStart + Math.floor(Math.random() * 4));
            }
        }
    }

    // Синкопы
    for (let i = 0; i < 3; i++) {
        if (Math.random() < 0.5) {
            pattern.add(Math.floor(Math.random() * 16));
        }
    }

    // Превращаем в массив
    let result = Array.from(pattern);

    // Лимиты
    const limits = {
        kick: { min: 2, max: 12 },
        snare: { min: 2, max: 10 },
        hihat: { min: 4, max: 16 },
        ride: { min: 3, max: 14 }
    };

    while (result.length < limits[instrument].min) {
        const b = Math.floor(Math.random() * 16);
        if (!result.includes(b)) {
            result.push(b);
        }
    }
    while (result.length > limits[instrument].max) {
        const idx = Math.floor(Math.random() * result.length);
        result.splice(idx, 1);
    }

    // Добавим акцент на сильную долю, если её нет
    if ((instrument === 'kick' || instrument === 'snare') && Math.random() < 0.7) {
        const hasStrong = result.some(b => b % 2 === 0);
        if (!hasStrong) {
            result.push(Math.floor(Math.random() * 8) * 2);
        }
    }

    return result.sort((a, b) => a - b);
};

// Генерация паттерна для всех включённых инструментов
const updateRandomPatterns = () => {
    const newPatterns = {};
    if (activeInstruments.kick) {
        newPatterns.kick = generateRandomPattern('kick');
    }
    if (activeInstruments.snare) {
        newPatterns.snare = generateRandomPattern('snare');
    }
    if (activeInstruments.hihat) {
        newPatterns.hihat = generateRandomPattern('hihat');
    }
    if (activeInstruments.ride) {
        newPatterns.ride = generateRandomPattern('ride');
    }
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
    while (nextNoteTime.value < audioContext.value.currentTime + SCHEDULE_AHEAD_TIME) {
        const soundTime = nextNoteTime.value;
        const currentBeatValue = currentBeat.value;
        
        // Планируем звук для следующего бита
        const nextBeat = (currentBeatValue + 1) % BEATS_TO_SHOW;
        const VISUAL_DELAY = 0.15; // 150ms задержка для визуального обновления
        
        // Планируем звук на текущее время
        scheduleNote(nextBeat, soundTime);

        // Рассчитываем задержку для визуального обновления (добавляем доп. задержку)
        const visualDelayMs = ((soundTime + VISUAL_DELAY) - audioContext.value.currentTime) * 1000;

        // Планируем визуальное обновление
        setTimeout(() => {
            currentBeat.value = nextBeat;
            
            // Если дошли до начала такта + включен рандом
            if (currentBeat.value === 0 && isRandomPattern.value) {
                updateRandomPatterns();
            }
        }, Math.max(0, visualDelayMs));

        nextNote();
    }

    if (isPlaying.value) {
        requestAnimationFrame(scheduler);
    }
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
        currentBeat.value = 0;
        isPlaying.value = true;
        nextNoteTime.value = audioContext.value.currentTime;

        requestAnimationFrame(scheduler);
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

// При размонтировании
onMounted(() => { });
onUnmounted(() => {
    stopPlaying();
    disposeAudioContext();
});
</script>

<style>
/* Tailwind + ручные стили */
input[type="range"] {
    @apply h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

input[type="range"]::-webkit-slider-thumb {
    @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
}

input[type="checkbox"] {
    @apply w-4 h-4 text-blue-500 rounded focus:ring-blue-500;
}

.playhead {
    @apply absolute top-0 bottom-0 bg-blue-600;
    width: 2px;
    will-change: transform;
    z-index: 10;
}

button:disabled {
    @apply opacity-50 cursor-not-allowed;
}

button {
    @apply font-medium;
    min-width: 120px;
}

button:hover {
    @apply transform scale-105 transition-transform;
}

button:active {
    @apply transform scale-95;
}

.note-symbol {
    @apply text-lg font-bold inline-flex items-center justify-center;
    width: 24px;
    height: 24px;
}

.note-symbol.active {
    @apply text-blue-500;
    transform: scale(1.2);
    transition: all 0.1s ease;
}
</style>
