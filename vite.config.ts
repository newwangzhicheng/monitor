import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': './lib'
    }
  },
  build: {
    lib: { entry: './lib/main.ts', name: 'index', fileName: 'index' }
  }
})
