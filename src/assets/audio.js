// src/assets/audio.js

let audioCtx = null;
let masterGain = null;
let clickGain = null;
let audioBuffers = {};

/**
 * Создаём или возвращаем AudioContext + загружаем звуки
 */
export const createAudioContext = async () => {
    if (audioCtx) {
        return audioCtx;
    }

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Общий гейн
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(audioCtx.destination);

        // Гейн для метронома
        clickGain = audioCtx.createGain();
        clickGain.gain.value = 0.3; // Начальная громкость
        clickGain.connect(audioCtx.destination);

        // Определяем базовый путь в зависимости от режима
        const basePath = import.meta.env.DEV ? '/src/assets/sounds/' : './assets/sounds/';

        // Загружаем семплы
        await Promise.all([
            loadSound('kick', `${basePath}bochka.wav`),
            loadSound('snare', `${basePath}malyiy-baraban.wav`),
            loadSound('hihat', `${basePath}hay-het.wav`),
            loadSound('ride', `${basePath}ride.wav`)
        ]);

        console.log('Audio context и семплы готовы!');
        return audioCtx;
    } catch (error) {
        console.error('Ошибка при создании audioContext:', error);
        throw error;
    }
};

/**
 * Вспомогательная: грузим звуковой файл, декодируем
 */
const loadSound = async (name, url) => {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBuffers[name] = audioBuffer;
        console.log(`Загружен звук: ${name}`);
    } catch (error) {
        console.error(`Ошибка загрузки звука ${name}:`, error);
    }
};

/**
 * Создание "клика" метронома (генеративно, без семпла)
 */
const createClickSound = (time) => {
    // Генерируем короткий "пик" синус + square
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, time); // Тон
    gainNode.gain.setValueAtTime(0.5, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gainNode);
    gainNode.connect(clickGain);

    osc.start(time);
    osc.stop(time + 0.05);

    // Добавим "щелчок"
    const noiseOsc = audioCtx.createOscillator();
    const noiseGain = audioCtx.createGain();

    noiseOsc.type = 'square';
    noiseOsc.frequency.setValueAtTime(2500, time);
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    noiseOsc.connect(noiseGain);
    noiseGain.connect(clickGain);

    noiseOsc.start(time);
    noiseOsc.stop(time + 0.02);
};

/**
 * Проигрывание звука (семпл) или клик
 */
const playSound = (buffer, time, isClick = false) => {
    if (isClick) {
        createClickSound(time);
    } else {
        // Играем семпл
        const source = audioCtx.createBufferSource();
        const gainNode = audioCtx.createGain();

        source.buffer = buffer;
        gainNode.gain.setValueAtTime(1, time);

        source.connect(gainNode);
        gainNode.connect(masterGain);

        source.start(time);
    }
};

/**
 * Вызываем эту функцию для любого инструмента (kick, snare, ...),
 * либо 'click' — тогда генерируем клик
 */
export const createSound = (context, type, time) => {
    if (!context) return;

    try {
        if (type === 'click') {
            playSound(null, time, true);
        } else if (audioBuffers[type]) {
            playSound(audioBuffers[type], time, false);
        } else {
            console.warn(`Звук для "${type}" не загружен!`);
        }
    } catch (error) {
        console.error(`Ошибка при проигрывании ${type}:`, error);
    }
};

/**
 * Установка громкости клика (метронома)
 */
export const setClickVolume = (volume) => {
    if (clickGain) {
        clickGain.gain.value = volume;
    }
};

/**
 * Закрываем всё и очищаем
 */
export const disposeAudioContext = () => {
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
        masterGain = null;
        clickGain = null;
        audioBuffers = {};
    }
};
