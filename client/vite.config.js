import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  css: {
    transformer: 'postcss',
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['lucidledger.co', 'www.lucidledger.co', 'frontend', 'localhost']
  },
  build: {
    // Increase the warning threshold for chunk sizes (in kB)
    chunkSizeWarningLimit: 1500,
    // Disable manual chunk splitting to avoid React context issues
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Production build settings
  base: '/',
  preview: {
    port: 5173,
    host: '0.0.0.0'
  }
});