/**
 * Exportación del plano del proyecto a DXF (ASCII, R12) y SVG — Fase 7.
 *
 * Convenciones (las mismas que lee el importador `importDXFToFloorPlan`, para que el DXF exportado se reimporte igual):
 * - `$INSUNITS = 4` (mm): las coordenadas son las del lienzo × escala (m/px) × 1000; el eje Y no se invierte (el
 *   importador tampoco lo invierte).
 * - Cada barrera es una entidad LINE en la capa `WALL_<TIPO>_<MATERIAL>_<espesor>MM`, con TIPO ∈ PRIMARY, SECONDARY,
 *   DOOR (fuga), NUCLEAR; el espesor es el instalado (`thickness_mm`) o, si no hay, el requerido redondeado hacia
 *   arriba, y se omite si no hay ninguno.
 * - Cada fuente es un POINT y un TEXT en la capa `RADSHIELD_FUENTES` (el importador no la toma como barrera).
 */
import type { Barrier, FloorPlan } from '@/types/radshield';
import { codigoCatalogo } from './shieldingMath';
import { espesorInstalado, espesorRequerido } from './verificacionBlindaje';

const TIPO: Record<Barrier['barrierType'], string> = {
  primary: 'PRIMARY', secondary: 'SECONDARY', scatter: 'SECONDARY', leakage: 'DOOR', nuclear: 'NUCLEAR',
};
const MATERIAL: Record<string, string> = {
  PB: 'LEAD', CONCRETE235: 'CONCRETE', CONCRETEBARITE: 'BARITE', STEEL: 'STEEL', LEADGLASS: 'GLASS', TUNGSTEN: 'TUNGSTEN', tungsteno: 'TUNGSTEN',
};
export const CAPA_FUENTES = 'RADSHIELD_FUENTES';

/** Espesor que se declara en la capa (mm): instalado; si no, requerido redondeado al mm; null si no hay. */
export function espesorCapa(b: Barrier): number | null {
  const inst = espesorInstalado(b).mm;
  if (inst) return Math.round(inst * 10) / 10;
  const req = espesorRequerido(b);
  return req && req > 0 ? Math.ceil(req) : null;
}

export function capaDXF(b: Barrier): string {
  const mat = MATERIAL[codigoCatalogo(b.materialCode)] ?? MATERIAL[b.materialCode] ?? 'CONCRETE';
  const t = espesorCapa(b);
  return `WALL_${TIPO[b.barrierType] ?? 'SECONDARY'}_${mat}${t ? `_${t}MM` : ''}`;
}

const n = (v: number) => (Math.round(v * 1000) / 1000).toString();
const COLOR: Record<string, number> = { PRIMARY: 1, SECONDARY: 3, DOOR: 5, NUCLEAR: 6 };

export function exportarDXF(plano: FloorPlan): string {
  const k = plano.scale_m_per_pixel * 1000; // px → mm
  const capas = Array.from(new Set(plano.barriers.map(capaDXF)));
  const out: string[] = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC'];
  out.push('0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER');
  for (const c of [...capas, CAPA_FUENTES]) out.push('0', 'LAYER', '2', c, '70', '0', '62', String(COLOR[c.split('_')[1]] ?? 7), '6', 'CONTINUOUS');
  out.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  for (const b of plano.barriers) {
    out.push('0', 'LINE', '8', capaDXF(b), '10', n(b.x1 * k), '20', n(b.y1 * k), '30', '0', '11', n(b.x2 * k), '21', n(b.y2 * k), '31', '0');
  }
  for (const s of plano.sources) {
    out.push('0', 'POINT', '8', CAPA_FUENTES, '10', n(s.x * k), '20', n(s.y * k), '30', '0');
    out.push('0', 'TEXT', '8', CAPA_FUENTES, '10', n(s.x * k), '20', n(s.y * k + 200), '30', '0', '40', '150', '1', `${s.name} (${s.modality.id})`);
  }
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\n') + '\n';
}

const esc = (t: string) => t.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

/** SVG en metros (1 unidad = 1 mm) con las barreras y fuentes del proyecto. */
export function exportarSVG(plano: FloorPlan): string {
  const k = plano.scale_m_per_pixel * 1000;
  const xs = [...plano.barriers.flatMap((b) => [b.x1, b.x2]), ...plano.sources.map((s) => s.x)].map((v) => v * k);
  const ys = [...plano.barriers.flatMap((b) => [b.y1, b.y2]), ...plano.sources.map((s) => s.y)].map((v) => v * k);
  const minX = Math.min(0, ...xs), minY = Math.min(0, ...ys), maxX = Math.max(1, ...xs), maxY = Math.max(1, ...ys);
  const m = 0.05 * Math.max(maxX - minX, maxY - minY);
  const lineas = plano.barriers.map((b) => {
    const w = espesorCapa(b) ?? 100;
    const color = b.barrierType === 'primary' ? '#dc2626' : b.barrierType === 'leakage' ? '#2563eb' : '#16a34a';
    return `<line x1="${n(b.x1 * k)}" y1="${n(b.y1 * k)}" x2="${n(b.x2 * k)}" y2="${n(b.y2 * k)}" stroke="${color}" stroke-width="${w}"><title>${esc(`${b.name} — ${capaDXF(b)}`)}</title></line>`;
  });
  const fuentes = plano.sources.map((s) => `<circle cx="${n(s.x * k)}" cy="${n(s.y * k)}" r="${n(m / 4)}" fill="#f97316"><title>${esc(s.name)}</title></circle>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(minX - m)} ${n(minY - m)} ${n(maxX - minX + 2 * m)} ${n(maxY - minY + 2 * m)}">`
    + `<title>${esc(plano.name)} (unidades: mm)</title>${lineas.join('')}${fuentes.join('')}</svg>\n`;
}
