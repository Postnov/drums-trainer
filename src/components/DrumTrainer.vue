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
    // Список базовых фигур для каждого инструмента
    const rhythmicFigures = {
        kick: [
            [0], [4], [8], [12], // Одиночные удары на сильные доли
            [0, 8], [4, 12], // Пары на сильных долях
            [0, 6], [2, 8], [4, 10], [6, 12], // Синкопы
            [0, 4, 8], [4, 8, 12], // Тройки
            [0, 3, 8, 11], [2, 6, 10, 14] // Сложные фигуры
        ],
        snare: [
            [4], [12], // Классика на 2 и 4
            [4, 12], // Стандартный бэк-бит
            [4, 10], [6, 12], // Синкопы
            [4, 7, 12], [4, 12, 14], // Триоли
            [2, 4, 12, 14], [4, 7, 12, 15] // Сложные фигуры
        ],
        hihat: [
            [0, 4, 8, 12], // Четверти
            [0, 2, 4, 6, 8, 10, 12, 14], // Восьмые
            [0, 3, 6, 9, 12, 15], // Триоли
            [0, 2, 4, 7, 8, 10, 12, 15], // Смешанный ритм
            [0, 1, 4, 5, 8, 9, 12, 13] // Шаффл
        ],
        ride: [
            [0, 4, 8, 12], // Четверти
            [0, 6, 8, 14], // Синкопы
            [0, 3, 6, 9, 12, 15], // Триоли
            [0, 2, 6, 8, 10, 14], // Джазовый ритм
            [0, 4, 7, 10, 12, 15] // Латинский ритм
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
        // Выбираем один такт для вариации (только такты 2-4)
        const variationMeasure = Math.floor(Math.random() * 3) + 1; // 1, 2 или 3
        const measureStart = variationMeasure * 4;
        
        // Удаляем ноты в выбранном такте
        pattern = new Set([...pattern].filter(beat => 
            beat < measureStart || beat >= measureStart + 4
        ));
        
        // Добавляем новую фигуру в этот такт
        const variationFigure = rhythmicFigures[instrument][
            Math.floor(Math.random() * rhythmicFigures[instrument].length)
        ];
        
        variationFigure.forEach(beat => {
            const adjustedBeat = measureStart + (beat % 4);
            pattern.add(adjustedBeat);
        });
    }

    // Превращаем в массив
    let result = Array.from(pattern);

    // Лимиты для разных инструментов (уменьшены, так как первый такт пустой)
    const limits = {
        kick: { min: 2, max: 6 },
        snare: { min: 2, max: 5 },
        hihat: { min: 3, max: 9 },
        ride: { min: 3, max: 8 }
    };

    // Обеспечиваем минимум и максимум нот (только в тактах 2-4)
    while (result.length < limits[instrument].min) {
        const beat = baseFigure[Math.floor(Math.random() * baseFigure.length)];
        const measure = Math.floor(Math.random() * 3) + 1; // Только такты 2-4
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
