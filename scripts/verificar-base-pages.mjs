// Fase 9 — verificación del build para GitHub Pages (el sitio se sirve en /<repo>/, no en la raíz del dominio).
//   node scripts/verificar-base-pages.mjs [dist] [/RadShieldMx/]
// Falla si:
//  - index.html carga scripts, estilos, ícono o manifest fuera de la base, o algún archivo referenciado no existe;
//  - algún chunk JS contiene una ruta absoluta a un archivo de public/ (daría 404 en Pages);
//  - el chunk de entrada pesa 1 400 kB o más (la carga diferida debe mantenerlo debajo).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] ?? 'dist';
const base = process.argv[3] ?? '/RadShieldMx/';
const LIMITE_ENTRADA_KB = 1400;
const fallas = [];

const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
const refs = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:)?\/\//.test(u));
for (const u of refs) {
  if (!u.startsWith(base)) fallas.push(`index.html: «${u}» no empieza con la base ${base}`);
  else if (!existsSync(path.join(dist, u.slice(base.length).split(/[?#]/)[0]))) fallas.push(`index.html: «${u}» no existe en ${dist}`);
}

// Archivos y carpetas de public/ que el código pide en tiempo de ejecución.
const publicos = readdirSync('public').map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const absoluta = new RegExp(`["'\`]/(?:${publicos.join('|')})(?=[/"'\`?#])`, 'g');
const assets = path.join(dist, 'assets');
const js = readdirSync(assets).filter((f) => f.endsWith('.js'));
for (const f of js) {
  const src = readFileSync(path.join(assets, f), 'utf8');
  const hall = [...new Set(src.match(absoluta) ?? [])];
  if (hall.length) fallas.push(`assets/${f}: rutas absolutas a public/ ${hall.join(', ')}`);
}

const entrada = /<script[^>]*type="module"[^>]*src="[^"]*\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
if (!entrada) fallas.push('index.html: no se encontró el chunk de entrada');
else {
  const kb = statSync(path.join(dist, entrada)).size / 1000;
  console.log(`Chunk de entrada ${entrada}: ${kb.toFixed(1)} kB (límite ${LIMITE_ENTRADA_KB} kB)`);
  if (kb >= LIMITE_ENTRADA_KB) fallas.push(`${entrada}: ${kb.toFixed(1)} kB ≥ ${LIMITE_ENTRADA_KB} kB`);
}

if (fallas.length) {
  console.error(`Build para Pages (${base}) con problemas:\n  ${fallas.join('\n  ')}`);
  process.exit(1);
}
console.log(`Build para Pages OK: ${refs.length} referencias de index.html bajo ${base}; ${js.length} chunks sin rutas absolutas a public/.`);
