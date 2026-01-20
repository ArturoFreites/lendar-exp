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
        // Code splitting automático de Vite (más seguro, evita errores de inicialización)
        // Vite maneja automáticamente el splitting de manera inteligente
        // Si necesitas control manual, descomenta manualChunks abajo
        /*
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Solo separar React (muy grande y estable)
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            // Todo lo demás junto (evita problemas de dependencias circulares)
            return 'vendor';
          }
        },
        */
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
