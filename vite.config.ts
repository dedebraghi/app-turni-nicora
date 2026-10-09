import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'apple-touch-icon.png',
        'logo-nicora.svg',
        'pwa-192x192.svg',
        'pwa-512x512.svg',
        'icon-192.png',
        'icon-512.png'
      ],
      manifest: {
        name: 'Nicora Garden - Turni',
        short_name: 'Turni Nicora',
        description: 'Gestione turni punto vendita Nicora Garden',
        theme_color: '#035F64',
        background_color: '#035F64',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000,
  }
})
