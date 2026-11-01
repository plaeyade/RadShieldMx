// Trinquete de ESLint: el CI falla si algún archivo suma errores respecto a la línea base.
// La deuda previa (2026-11-01) queda en .eslint-baseline.json y sólo puede bajar.
//   node scripts/lint-ratchet.mjs            → verifica
//   node scripts/lint-ratchet.mjs --update   → reescribe la línea base (sólo tras reducir errores)
import { ESLint } from 'eslint';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative } from 'node:path';

const BASE = '.eslint-baseline.json';
const eslint = new ESLint();
const results = await eslint.lintFiles(['.']);
const actual = {};
for (const r of results) {
  for (const m of r.messages) {
    if (m.severity !== 2) continue;
    const key = `${relative(process.cwd(), r.filePath)}::${m.ruleId ?? 'parse'}`;
    actual[key] = (actual[key] ?? 0) + 1;
  }
}
const total = Object.values(actual).reduce((a, b) => a + b, 0);

if (process.argv.includes('--update')) {
  const ordenado = Object.fromEntries(Object.entries(actual).sort());
  writeFileSync(BASE, `${JSON.stringify({ total, errores: ordenado }, null, 1)}\n`);
  console.log(`Línea base actualizada: ${total} errores.`);
  process.exit(0);
}

const base = existsSync(BASE) ? JSON.parse(readFileSync(BASE, 'utf8')).errores : {};
const nuevos = Object.entries(actual).filter(([k, n]) => n > (base[k] ?? 0));
if (nuevos.length) {
  console.error('ESLint: errores nuevos respecto a la línea base:');
  for (const [k, n] of nuevos) console.error(`  ${k}: ${base[k] ?? 0} → ${n}`);
  process.exit(1);
}
const antes = Object.values(base).reduce((a, b) => a + b, 0);
console.log(`ESLint OK: ${total} errores (línea base ${antes}); ninguno nuevo.${total < antes ? ' Ejecuta --update para fijar la mejora.' : ''}`);
