import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// Cada parte da extensão (popup, opções e service worker) é uma entrada separada do build.
// O manifest.json e os ícones ficam em public/ e são copiados como estão para dist/.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        stats: resolve(__dirname, 'stats.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        // O manifest aponta para background.js, então esse arquivo não pode ter hash no nome
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
})
