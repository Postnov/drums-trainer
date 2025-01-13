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

      <!-- Табы -->
      <div class="mb-6">
        <nav class="flex justify-center space-x-4" aria-label="Tabs">
          <button v-for="tab in tabs" 
                  :key="tab.id" 
                  @click="switchMode(tab.id)"
                  class="px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                  :class="[
                      currentMode === tab.id 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  ]">
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Компоненты -->
      <DrumTrainer v-if="currentMode === 'drums'" ref="drumTrainer" />
      <CoordinationTrainer v-else ref="coordTrainer" />
    </div>

    <!-- Контакты (вне основного контейнера) -->
    <footer class="mt-12 py-6 bg-white border-t border-gray-100">
      <div class="max-w-6xl mx-auto px-4">
        <div class="text-center text-sm text-gray-600">
          <p class="font-medium">Автор — Даниил Постнов</p>
          <div class="mt-2 space-x-4">
            <a href="https://t.me/danya_postnov" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-blue-600 hover:text-blue-700 hover:underline">
              Телеграм: @danya_postnov
            </a>
            <span class="text-gray-400">|</span>
            <a href="https://dev-postnov.ru" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-blue-600 hover:text-blue-700 hover:underline">
              Сайт: dev-postnov.ru
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DrumTrainer from './components/DrumTrainer.vue'
import CoordinationTrainer from './components/trainers/CoordinationTrainer.vue'

const tabs = [
  { id: 'drums', name: 'Ударная установка' },
  { id: 'coordination', name: 'Координация' }
]

const currentMode = ref('drums')
const drumTrainer = ref(null)
const coordTrainer = ref(null)

// Функция переключения режима с остановкой воспроизведения
const switchMode = (mode) => {
  // Останавливаем текущий тренажер
  if (currentMode.value === 'drums' && drumTrainer.value) {
    drumTrainer.value.stopPlaying()
  } else if (currentMode.value === 'coordination' && coordTrainer.value) {
    coordTrainer.value.stopPlaying()
  }
  
  // Переключаем режим
  currentMode.value = mode
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Golos Text', system-ui, sans-serif;
  }
}
</style> 