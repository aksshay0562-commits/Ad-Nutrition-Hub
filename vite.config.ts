import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'AD Nutrition Hub Israna',
          short_name: 'AD Nutrition',
          description: 'Premier nutrition and fitness supplement store in Mandi Mor, Israna, Panipat, Haryana. Authentic proteins, gainers, pre-workouts, and accessories.',
          theme_color: '#0a0a0a',
          background_color: '#0a0a0a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Clean up outdated caches automatically
          cleanupOutdatedCaches: true,
          // Navigate fallback to index.html for SPA offline routing
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            // 1. Google Fonts stylesheets
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 2. Google Fonts webfont files (woff, woff2)
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 3. Product Catalog API: NetworkFirst with fallback to cache for offline access
            {
              urlPattern: /\/api\/products.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-products-catalog-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days offline retention
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 4. Store Info API: StaleWhileRevalidate for instant loading + offline access
            {
              urlPattern: /\/api\/store-info.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-store-info-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 5. Visits & Order Mock Status APIs: NetworkFirst with offline cache fallback
            {
              urlPattern: /\/api\/(visits|orders\/mock-status|health).*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-general-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 6. Remote product images (Unsplash, CDN, Firestore images)
            {
              urlPattern: /^https:\/\/(images\.unsplash\.com|lh3\.googleusercontent\.com|firebasestorage\.googleapis\.com)\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'product-external-images-cache',
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 7. Local static images and SVGs
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-images-cache',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true, // Enables service worker in development / preview for offline testing
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio preview iframe
      hmr: false,
      watch: null,
    },
  };
});
