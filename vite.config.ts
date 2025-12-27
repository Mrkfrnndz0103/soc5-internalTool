import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // add manualChunks to split vendor libraries into smaller bundles
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // prefer splitting known large libraries into separate chunks
            if (id.includes('recharts') || id.includes('@tanstack')) return 'vendor-charts'
            if (id.includes('gsap')) return 'vendor-gsap'
            if (id.includes('date-fns')) return 'vendor-date-fns'
            if (id.includes('lucide-react')) return 'vendor-icons'
            return 'vendor'
          }
        },
      },
    },
    // increase limit slightly to avoid CI noise while we measure improvements
    chunkSizeWarningLimit: 700,
  },
})

