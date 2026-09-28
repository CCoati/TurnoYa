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
  optimizeDeps: {
    include: [
      '@fullcalendar/react',
      '@fullcalendar/core',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/list',
      '@fullcalendar/interaction',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Supabase is used globally (AuthContext, BusinessContext) — shared vendor chunk
          'vendor-supabase': ['@supabase/supabase-js'],
          // React is used everywhere — stable vendor chunk for browser caching
          'vendor-react': ['react', 'react-dom'],
          // FullCalendar and lucide-react are NOT listed here intentionally:
          // they get code-split naturally with their respective lazy-loaded views
        },
      },
    },
  },
})

