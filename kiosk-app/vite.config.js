import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ensure Capacitor bridge script is excluded from optimization
  optimizeDeps: {
    exclude: ['@capacitor/core'],
  },
});
