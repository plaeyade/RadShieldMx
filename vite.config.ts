import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    reportCompressedSize: false,
    sourcemap: false,
    target: 'esnext',
    // Fase 1 motor de dosis: 5000 ocultaba un chunk de entrada de 3.9 MB; ver docs/plan-motores-calculo.md (Fase 6).
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
  },
});
