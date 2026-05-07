import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '\u5171\u8BFB\u4E66\u623F',
        short_name: '\u5171\u8BFB\u4E66\u623F',
        description: '\u4E00\u4E2A\u6E29\u6696\u7684AI\u5171\u8BFB\u4F34\u4FA3',
        theme_color: '#F7F5F3',
        background_color: '#F7F5F3',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
