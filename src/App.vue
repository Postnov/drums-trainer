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

      <!-- Табы для переключения режимов -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div class="border-b border-gray-200">
          <nav class="flex" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="switchMode(tab.id)"
              :class="[
                currentMode === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm text-center'
              ]"
            >
              {{ tab.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Компоненты -->
      <DrumTrainer 
        v-if="currentMode === 'drums'" 
        ref="drumTrainer"
      />
      <CoordinationTrainer 
        v-else 
        ref="coordTrainer"
      />
    </div>
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
@tailwind base;
@tailwind components;
@tailwind utilities;
</style> 