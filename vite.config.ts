import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Vista 3D Babylon activa por omisión (23-11-2026); misma regla que `visor3DBabylonActivo` en featureFlags.ts.
  // Con VITE_VISOR_3D_BABYLON=false Babylon queda como rama muerta; asignarle un chunk sólo daría un chunk vacío.
  const babylonEnv = loadEnv(mode, process.cwd(), 'VITE_').VITE_VISOR_3D_BABYLON;
  const babylonActivo = babylonEnv !== 'false' && babylonEnv !== '0';
  // Fase 9 (GitHub Pages): el CI construye con VITE_BASE_PATH=/RadShieldMx/ (el sitio vive en /<repo>/); en local,
  // Netlify, Vercel y Docker la base relativa './' sigue sirviendo desde cualquier carpeta.
  const base = process.env.VITE_BASE_PATH || './';
  return {
  base,
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
        // su visor (todos sus importadores son lazy()/import()). Babylon (`vendor-babylon`) sólo lo importa
        // BabylonRuntimeSmokePreview con import() al abrir la vista 3D.
        // Las dependencias compartidas con la entrada (react, zustand, sonner, ayudantes de Rollup) se
        // fijan en `vendor-react`; si no, Rollup las metería en el chunk 3D/GPU y la entrada lo importaría
        // de forma estática (se descargaría al arrancar).
        manualChunks(id: string) {
          if (/\/node_modules\/(react|react-dom|scheduler|sonner|zustand|use-sync-external-store|@babel\/runtime)\//.test(id)
            || id.startsWith('\0commonjsHelpers') || id.includes('vite/preload-helper')) return 'vendor-react';
          // Shaders y extensiones glTF de Babylon se piden con import() bajo demanda (material compilado, extensión
          // declarada por el GLB): fuera de `vendor-babylon` quedan en chunks propios y no inflan el chunk principal.
          if (babylonActivo && id.includes('/node_modules/@babylonjs/')
            && !/\/@babylonjs\/(core\/Shaders(WGSL)?|loaders\/glTF\/2\.0\/Extensions)\//.test(id)) return 'vendor-babylon';
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
