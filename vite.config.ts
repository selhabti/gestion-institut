import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      tsDecorators: true,
      plugins: []
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      },
      manifest: {
        name: "Institut Manager",
        short_name: "InstitutApp",
        description: "Application de gestion d'institut pour le suivi des élèves et présences",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/coran.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/coran.png",
            sizes: "512x512", 
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["education", "productivity"],
        lang: "fr"
      },
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'date-fns',
      'zod'
    ],
    exclude: ['@radix-ui/react-tooltip']
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            if (id.includes('date-fns') || id.includes('zod')) {
              return 'utils';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true,
    fs: {
      strict: false
    },
    watch: {
      usePolling: true
    }
  },
  preview: {
    port: 8080,
    host: '0.0.0.0'
  }
});