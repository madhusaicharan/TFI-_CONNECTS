import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Fast refresh stays on by default
    }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) requires manualChunks as a function
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
            if (id.includes('gsap') || id.includes('lenis'))          return 'vendor-animation';
            if (id.includes('lucide'))                                 return 'vendor-icons';
            if (id.includes('react-dom'))                              return 'vendor-react';
            if (id.includes('react'))                                  return 'vendor-react';
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    // Proxy API calls in dev so the frontend doesn't need CORS changes
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Optimise deps for faster cold starts
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
});
