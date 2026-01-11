// vite.config.js - PERBAIKAN REWRITE
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api.php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // ✅ Hapus /api dari path
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🚀 Proxying:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📡 Proxied Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-libs": ["jspdf", "html2canvas"],
          "ui-libs": ["react-router-dom", "axios"],
          vendor: ["react", "react-dom"],
        },
      },
    },
  }
});