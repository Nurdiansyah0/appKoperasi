import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ HANYA library yang benar-benar ada di project
          "pdf-libs": ["jspdf", "html2canvas"],
          "ui-libs": ["react-router-dom", "axios"],
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      "Content-Security-Policy":
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:5173; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost http://localhost:5173 ws://localhost:5173;",
    },
  },
});
