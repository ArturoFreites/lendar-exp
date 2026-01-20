import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react({
      // Optimizaciones de React
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  
  // Optimizaciones de build para producción
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Desactivar sourcemaps en producción para menor tamaño
    minify: 'esbuild', // Usar esbuild (más rápido que terser, viene incluido)
    cssMinify: true,
    rollupOptions: {
      output: {
        // Code splitting optimizado
        manualChunks: (id) => {
          // React y React DOM
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Firebase
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          // Radix UI (componentes UI)
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
          // Charts
          if (id.includes('node_modules/recharts')) {
            return 'chart-vendor';
          }
          // Forms
          if (id.includes('node_modules/react-hook-form')) {
            return 'form-vendor';
          }
          // Date libraries
          if (id.includes('node_modules/date-fns')) {
            return 'date-vendor';
          }
          // MUI (si se usa)
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) {
            return 'mui-vendor';
          }
          // Otros node_modules grandes
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Nombres de archivos con hash para cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimizar para producción
    target: 'esnext',
    cssCodeSplit: true,
    // Reportar bundle size
    reportCompressedSize: true,
  },
  
  // Optimizaciones de servidor (para desarrollo)
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
  
  // Previsualización (para testing de build)
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
  
  // Optimizaciones de esbuild
  esbuild: {
    // Remover console.log y debugger en producción
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
