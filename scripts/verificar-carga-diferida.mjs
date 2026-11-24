#!/usr/bin/env node
/**
 * Depuración etapa 7: three, @react-three/* y @tensorflow/tfjs se cargan de forma diferida.
 * Comprueba en el build (`dist/`) que ni el arranque (scripts de index.html y su cierre de imports estáticos)
 * ni la apertura de los diálogos que sólo los usan en una ruta opcional (DoseMapDialog: vista 3D;
 * MLPredictionDialog: entrenar/predecir) descargan vendor-three, vendor-r3f o el chunk de tfjs (tfDiferido).
 * Fase 13 (vista 3D Babylon activa por omisión, 23-11-2026): ni el arranque ni abrir Inspección 3D
 * (MedicalFloorPlan3DDialog) cargan `vendor-babylon` de forma estática; sólo lo pide el import() de la vista.
 * Uso: node scripts/verificar-carga-diferida.mjs [dist]
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] || 'dist';
const assets = path.join(dist, 'assets');
const archivos = fs.readdirSync(assets).filter((f) => f.endsWith('.js'));
const deps = (f) => [...fs.readFileSync(path.join(assets, f), 'utf8').matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g)].map((m) => m[1]);
const cierre = (inicio) => {
  const vistos = new Set();
  const cola = [...inicio];
  while (cola.length) {
    const f = cola.pop();
    if (vistos.has(f) || !archivos.includes(f)) continue;
    vistos.add(f);
    cola.push(...deps(f));
  }
  return vistos;
};
const bytes = (s) => [...s].reduce((t, f) => t + fs.statSync(path.join(assets, f)).size, 0);
// TensorFlow.js queda en el chunk de `src/lib/ml/tfDiferido.ts` (sin manualChunks: con un chunk `vendor-tfjs` Rollup
// colgaba su import de efectos del diálogo y volvía a cargarlo al abrir).
const PESADOS = /^(vendor-three|vendor-r3f|tfDiferido|vendor-babylon)-/;
const BABYLON = /^vendor-babylon-/;

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const arranque = cierre([...html.matchAll(/assets\/([^"']+\.js)/g)].map((m) => m[1]));
let fallos = 0;
const revisar = (nombre, conjunto, patron = PESADOS) => {
  const pesados = [...conjunto].filter((f) => patron.test(f));
  console.log(`${nombre}: ${bytes(conjunto)} B en ${conjunto.size} chunks${pesados.length ? ` — CARGA ${pesados.join(', ')}` : ''}`);
  if (pesados.length) fallos++;
};
revisar('arranque', arranque);
for (const dialogo of ['DoseMapDialog', 'MLPredictionDialog']) {
  const f = archivos.find((x) => x.startsWith(`${dialogo}-`));
  if (!f) { console.log(`${dialogo}: sin chunk`); fallos++; continue; }
  revisar(`abrir ${dialogo}`, new Set([...cierre([f])].filter((x) => !arranque.has(x))));
}
// Inspección 3D monta Three/R3F al abrir (estático); Babylon debe seguir detrás de import().
{
  const f = archivos.find((x) => x.startsWith('MedicalFloorPlan3DDialog-'));
  if (!f) { console.log('MedicalFloorPlan3DDialog: sin chunk'); fallos++; }
  else revisar('abrir MedicalFloorPlan3DDialog (Babylon)', new Set([...cierre([f])].filter((x) => !arranque.has(x))), BABYLON);
}
const babylon = archivos.find((x) => BABYLON.test(x));
console.log(`vendor-babylon: ${babylon ? `${fs.statSync(path.join(assets, babylon)).size} B (diferido)` : 'no existe (VITE_VISOR_3D_BABYLON=false)'}`);
for (const v of ['vendor-three', 'vendor-r3f', 'tfDiferido']) {
  const f = archivos.find((x) => x.startsWith(`${v}-`));
  console.log(`${v}: ${f ? `${fs.statSync(path.join(assets, f)).size} B (diferido)` : 'no existe'}`);
  if (!f) fallos++;
}
if (fallos) { console.error(`carga diferida: ${fallos} fallo(s)`); process.exit(1); }
console.log('carga diferida OK');
