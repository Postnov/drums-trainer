<template>
    <div class="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        <div class="space-y-6">
            <h1 class="text-center text-3xl font-bold text-gray-800">
                Тренажёр барабанщика
            </h1>

            <!-- Управление темпом и воспроизведением -->
            <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-medium">Темп: {{ tempo }} BPM</span>
                    <div class="flex gap-2">
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
                <input type="range" v-model="tempo" min="40" max="200" step="1" class="tempo-slider" />
            </div>

            <!-- Выбор инструментов -->
            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div v-for="(active, instrument) in activeInstruments" :key="instrument"
                    class="flex items-center space-x-3">
                    <input type="checkbox" :id="instrument" v-model="activeInstruments[instrument]"
                        class="instrument-checkbox" />
                    <label :for="instrument" class="text-gray-700">{{ instrumentNames[instrument] }}</label>
                </div>
                <div class="flex items-center space-x-3 col-span-2 mt-2 pt-2 border-t">
                    <input type="checkbox" id="randomPattern" v-model="isRandomPattern" class="instrument-checkbox" />
                    <label for="randomPattern" class="text-gray-700">Случайный ритм каждые 4 такта</label>
                </div>
            </div>

            <!-- Нотный стан (увеличили высоту до h-96) -->
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

                    <!-- Линия таймлайна (скорректирован left и переход) -->
                    <div class="playhead absolute top-0 h-full" :style="{
                        left: `${(currentBeat) * (100 / BEATS_TO_SHOW)}%`,
                        transition: isPlaying ? 'none' : 'none'
                    }"></div>
                </div>

                <div class="relative h-96"><!-- h-64 заменили на h-96 -->

                    <!-- Горизонтальные линии нотного стана (можно увеличить их интервал) -->
                    <div v-for="line in 5" :key="`staff-${line}`" class="absolute w-full h-[1px] bg-gray-300"
                        :style="{ top: `${(line - 1) * 20}px` }"></div>

                    <!-- Горизонтальные линии для инструментов (позиции расширили) -->
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

                    <!-- Ноты (убираем translateX(-50%), чтобы совпадали точнее) -->
                    <div v-for="beatIndex in BEATS_TO_SHOW" :key="`beat-${beatIndex}`" class="absolute h-full" :style="{
                        left: `calc(${((beatIndex - 1) / (BEATS_TO_SHOW - 1)) * 100}%)`,
                        width: '20px',
                        transform: 'translateX(-50%)'
                    }">
                        <template v-for="(pattern, instrument) in currentPatterns"
                            :key="`note-${instrument}-${beatIndex}`">
                            <div v-if="activeInstruments[instrument] && pattern.includes(beatIndex - 1)"
                                class="absolute flex items-center justify-center w-full"
                                :style="{ top: `${getInstrumentPosition(instrument) - 8}px` }">
                                <span class="note-symbol" :class="{ 'text-blue-500': currentBeat === beatIndex - 1 }">
                                    {{ noteSymbols[instrument] }}
                                </span>
                            </div>
                        </template>
                    </div>

                    <!-- Курсор воспроизведения (тоже синхронизирован) -->
                    <div class="playhead" :style="{
                        left: `${(currentBeat) * (100 / BEATS_TO_SHOW)}%`,
                        transition: isPlaying ? 'none' : 'none'
                    }"></div>

                    <!-- Названия инструментов -->
                    <div class="absolute -left-36 h-full">
                        <div v-for="(name, instrument) in instrumentNames" :key="`label-${instrument}`"
                            class="absolute flex items-center space-x-2"
                            :style="{ top: `${getInstrumentPosition(instrument) - 8}px` }">
                            <span class="w-28 text-right text-gray-700">
                                {{ name.split(' ')[0] }}
                            </span>
                            <span class="note-symbol">{{ noteSymbols[instrument] }}</span>
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
import { createAudioContext, createSound } from '../assets/audio.js';

const BEATS_TO_SHOW = 16;
const SCHEDULE_AHEAD_TIME = 0.1;    // Секунды
const SCHEDULE_INTERVAL = 25;       // Миллисекунды
const LOOKAHEAD = 25.0;            // Как часто планировщик проверяет ноты

const tempo = ref(90);
const isPlaying = ref(false);
const currentBeat = ref(0);
const audioContext = ref(null);
const nextNoteTime = ref(0);
const timerID = ref(null);
const lastDrawTime = ref(0);

const activeInstruments = reactive({
    kick: true,
    hihat: true,
    snare: true,
    ride: true,
});

const instrumentNames = {
    kick: 'Бочка (правая нога)',
    hihat: 'Хай-хэт (левая нога)',
    snare: 'Малый барабан (левая рука)',
    ride: 'Райд (правая рука)',
};

const noteSymbols = {
    kick: '●',
    hihat: '×',
    snare: '○',
    ride: '△',
};

// Базовый паттерн (0-based индексы долей)
const basePatterns = {
    kick: [0, 4, 8, 12],           // На каждый такт
    hihat: [0, 2, 4, 6, 8, 10, 12, 14], // На каждую вторую долю
    snare: [4, 12],                // На 2 и 4 такт
    ride: [0, 4, 8, 12],           // На каждый такт
};

const isRandomPattern = ref(false);
const currentPatterns = ref({ ...basePatterns });

// Увеличили позиции, чтобы нотный стан «дышал» просторнее
const getInstrumentPosition = (instrument) => {
    const positions = {
        ride: 20,  // был 8
        snare: 40, // был 24
        hihat: 60, // был 40
        kick: 80,  // был 56
    };
    return positions[instrument];
};

const generateRandomPattern = (instrument) => {
    const pattern = [];
    const density = {
        kick: 0.25,
        hihat: 0.5,
        snare: 0.25,
        ride: 0.25
    };

    // Генерируем ноты только на тактах (каждая четвертая доля)
    for (let i = 0; i < BEATS_TO_SHOW; i += 1) {
        if (Math.random() < density[instrument]) {
            pattern.push(i);
        }
    }

    // Гарантируем хотя бы одну ноту на такте
    if (pattern.length === 0) {
        // Выбираем случайный такт (0, 4, 8 или 12)
        const randomBar = Math.floor(Math.random() * 4) * 4;
        pattern.push(randomBar);
    }
    return pattern;
};

const updateRandomPatterns = () => {
    const newPatterns = {};
    Object.keys(basePatterns).forEach((instrument) => {
        newPatterns[instrument] = generateRandomPattern(instrument);
    });
    currentPatterns.value = newPatterns;
};

const scheduleNote = (beatNumber, time) => {
    // Сначала проигрываем звуки инструментов
    Object.entries(currentPatterns.value).forEach(([instrument, pattern]) => {
        if (activeInstruments[instrument] && pattern.includes(beatNumber)) {
            createSound(audioContext.value, instrument, time);
        }
    });

    // Затем метроном, если это начало такта
    if (beatNumber % 4 === 0) {
        createSound(audioContext.value, 'click', time);
    }
};

const nextNote = () => {
    const secondsPerBeat = 60.0 / tempo.value;
    nextNoteTime.value += secondsPerBeat;
};

const scheduler = () => {
    while (nextNoteTime.value < audioContext.value.ctx.currentTime + SCHEDULE_AHEAD_TIME) {
        scheduleNote(currentBeat.value, nextNoteTime.value);

        // Обновляем визуальное состояние
        if (currentBeat.value === 0 && isRandomPattern.value) {
            updateRandomPatterns();
        }

        // Переходим к следующей доле
        currentBeat.value = (currentBeat.value + 1) % BEATS_TO_SHOW;
        nextNote();
    }

    // Используем RAF для более плавной анимации
    if (isPlaying.value) {
        requestAnimationFrame(scheduler);
    }
};

const startPlaying = () => {
    if (!audioContext.value) {
        audioContext.value = createAudioContext();
    }

    if (audioContext.value.ctx.state === 'suspended') {
        audioContext.value.ctx.resume();
    }

    currentBeat.value = 0;
    isPlaying.value = true;
    nextNoteTime.value = audioContext.value.ctx.currentTime;

    // Запускаем планировщик через RAF
    requestAnimationFrame(scheduler);
};

const stopPlaying = () => {
    isPlaying.value = false;
    currentBeat.value = 0;

    if (timerID.value) {
        clearTimeout(timerID.value);
        timerID.value = null;
    }
};

// Следим за изменением темпа
watch(tempo, (newTempo) => {
    if (isPlaying.value) {
        // Перезапускаем воспроизведение при изменении темпа
        stopPlaying();
        startPlaying();
    }
});

const togglePlaying = () => {
    if (isPlaying.value) {
        stopPlaying();
    } else {
        startPlaying();
    }
};

// Функция для генерации нового паттерна
const generateNewPattern = () => {
    updateRandomPatterns();
};

// Следим за изменением флага случайного режима
watch(isRandomPattern, (newValue) => {
    if (!newValue) {
        currentPatterns.value = { ...basePatterns };
    } else {
        updateRandomPatterns();
    }
});

onMounted(() => {
    audioContext.value = createAudioContext();
});

onUnmounted(() => {
    stopPlaying();
    if (audioContext.value) {
        audioContext.value.close();
    }
});
</script>

<style>
input[type="range"] {
    @apply h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

input[type="range"]::-webkit-slider-thumb {
    @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
}

input[type="checkbox"] {
    @apply w-4 h-4 text-blue-500 rounded focus:ring-blue-500;
}

/* Улучшаем плавность анимации курсора */
.playhead {
    @apply absolute top-0 bottom-0;
    @apply bg-blue-600;
    width: 2px;
    will-change: transform;
    z-index: 10;
}

/* Добавляем стили для кнопки нового ритма */
button:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Обновляем стили для кнопок */
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

/* Добавляем стили для тактовых линий */
.beat-line {
    @apply absolute h-full border-l border-gray-300;
}

.beat-line-main {
    @apply border-l-2 border-gray-400;
}

/* Добавляем стили для нот */
.note-symbol {
    @apply text-lg font-bold;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
}

.note-symbol.active {
    @apply text-blue-500;
    transform: scale(1.2);
    transition: all 0.1s ease;
}
</style>
