// Core
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works from any sub-path / when the folder is moved.
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.png', 'icons/icon-180.png', 'sounds/*.wav', 'sounds/*.mp3'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,wav,mp3,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
      manifest: {
        // Explicit, globally-unique app identity. Without this, iOS derives identity
        // from start_url ('./' -> '/') and can confuse this app with other root-scoped PWAs.
        id: '/box-timer',
        name: 'Box Timer',
        short_name: 'Box Timer',
        description: 'Boxing & workout interval timer — rounds, work/rest, sounds and prep countdown.',
        theme_color: '#071533',
        background_color: '#071533',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
