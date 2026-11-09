import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Con VITE_VISOR_3D_BABYLON apagada Babylon queda como rama muerta; asignarle un chunk sólo daría un chunk vacío.
  const babylonActivo = loadEnv(mode, process.cwd(), 'VITE_').VITE_VISOR_3D_BABYLON === 'true';
  return {
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
    rollupOptions: {
      output: {
        // Fase 6: los motores 3D y el shader GPU van en chunks propios que sólo se descargan al abrir
        // su visor (todos sus importadores son lazy()/import()). Babylon se conserva tras VISOR_3D_BABYLON.
        // Las dependencias compartidas con la entrada (react, zustand, sonner, ayudantes de Rollup) se
        // fijan en `vendor-react`; si no, Rollup las metería en el chunk 3D/GPU y la entrada lo importaría
        // de forma estática (se descargaría al arrancar).
        manualChunks(id: string) {
          if (/\/node_modules\/(react|react-dom|scheduler|sonner|zustand|use-sync-external-store|@babel\/runtime)\//.test(id)
            || id.startsWith('\0commonjsHelpers') || id.includes('vite/preload-helper')) return 'vendor-react';
          if (babylonActivo && id.includes('/node_modules/@babylonjs/')) return 'vendor-babylon';
          if (id.includes('/node_modules/@react-three/') || id.includes('/node_modules/three-stdlib/')) return 'vendor-r3f';
          if (/\/node_modules\/three\//.test(id)) return 'vendor-three';
          if (/\/src\/hooks\/useWebGPU(Heatmap)?\.ts$/.test(id) || id.endsWith('/src/hooks/WebGPUHeatmapBridge.tsx')) return 'gpu-heatmap';
          return undefined;
        },
      },
    },
  },
};
});
