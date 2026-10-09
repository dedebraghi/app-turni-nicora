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
        'icon-512.png',
        'icon-nicora-512.png',
        'icon-nicora-256.png',
        'icon-nicora-192.png',
        'icon-nicora-128.png',
        'icon-nicora-64.png',
        'icon-nicora-48.png',
        'icon-nicora-32.png',
        'icon-nicora-16.png'
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
            src: '/icon-nicora-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-64.png',
            sizes: '64x64',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-48.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-16.png',
            sizes: '16x16',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-nicora-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-nicora-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
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
