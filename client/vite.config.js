import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
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
    rollupOptions: {
      output: {
        // Split vendor libraries to keep the main chunk smaller
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor'
            if (id.includes('date-fns')) return 'date-fns'
            return 'vendor'
          }
        },
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