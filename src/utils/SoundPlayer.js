export const scheduleNote = (beat, time) => {
    // Проигрываем звуки для каждого инструмента
    Object.entries(patterns).forEach(([instrument, pattern]) => {
        if (pattern[beat]) {
            playSound(instrument, time);
        }
    });
}; 