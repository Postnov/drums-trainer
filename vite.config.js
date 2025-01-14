import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Используем относительные пути
  plugins: [
    vue(),
    {
      name: 'copy-sound-files',
      writeBundle() {
        // Создаем директорию для звуков, если её нет
        mkdirSync('dist/assets/sounds', { recursive: true })
        
        // Копируем звуковые файлы
        const soundFiles = [
          'click.mp3',
          'ride.wav',
          'malyiy-baraban.wav',
          'bochka.wav',
          'hay-het.wav'
        ]
        
        soundFiles.forEach(file => {
          copyFileSync(
            `src/assets/sounds/${file}`,
            `dist/assets/sounds/${file}`
          )
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Сохраняем структуру директорий для всех ассетов
          const type = assetInfo.name.split('.').pop()
          if (/\.(png|svg)$/.test(assetInfo.name)) {
            return 'assets/legs-hands-icons/[name][extname]'
          }
          if (/\.(mp3|wav)$/.test(assetInfo.name)) {
            return 'assets/sounds/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },
    assetsInlineLimit: 0, // Отключаем инлайн маленьких файлов
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}) 