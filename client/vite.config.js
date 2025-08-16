import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      includeAssets: ['logo.png'],
      manifest: {
        name: "Lucid Ledger",
        short_name: "LucidLedger",
        description: "A Vite-powered Progressive Web App",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        // Allow precaching of larger bundles produced by the build
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['lucidledger.co', 'www.lucidledger.co', '3.131.3.144']
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