/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ledger/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        // The chart bundle is large and only some routes render charts, so it
        // is fetched on demand and cached after first use instead of being
        // pushed into the install-time precache.
        globIgnores: ['**/charts-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/charts-.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'ledger-charts' },
          },
        ],
      },
      manifest: {
        name: 'Ledger',
        short_name: 'Ledger',
        description: 'A highly scalable, cross-platform financial dashboard',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192x192-v2.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512-v2.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512x512-maskable-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/worktrees/**', 'e2e/**'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev'),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Vite's `manualChunks` function is translated by rolldown into a
        // single dynamic-name codeSplitting group, which silently merged the
        // recharts-only redux/immer modules back into the `charts` chunk
        // instead of honoring the separate name returned for them. Using
        // `codeSplitting.groups` directly (rolldown's non-deprecated,
        // documented API) gives each named chunk its own group so the split
        // actually takes effect.
        codeSplitting: {
          groups: [
            {
              // recharts's own state management (redux/immer/reselect) is
              // only ever loaded alongside recharts, so it is split into a
              // second charts-prefixed chunk to keep the primary chart
              // chunk under budget while still being excluded from the
              // precache and covered by the same runtime-caching pattern.
              name: 'charts-vendor',
              test: /node_modules[\\/](@reduxjs[\\/]toolkit|redux|redux-thunk|react-redux|reselect|immer)[\\/]/,
              priority: 3,
            },
            {
              // recharts pulls in d3 and victory-vendor. Grouping them
              // keeps the chart dependency in one lazily loaded chunk
              // instead of being hoisted into whichever shared chunk
              // imports it first.
              name: 'charts',
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/,
              priority: 2,
            },
            {
              name: 'motion',
              test: /node_modules[\\/](framer-motion|motion-dom)[\\/]/,
              priority: 2,
            },
            {
              // react-dom and react-router-dom are on every route from
              // first paint, so pulling them out of the entry chunk into a
              // dedicated vendor chunk keeps the app's own code (the
              // actual entry) under budget without changing what loads on
              // first visit.
              name: 'vendor-react',
              test: /node_modules[\\/](react-dom|react|scheduler|use-sync-external-store)[\\/]/,
              priority: 1,
            },
            {
              name: 'vendor-router',
              test: /node_modules[\\/]react-router[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  }
})
