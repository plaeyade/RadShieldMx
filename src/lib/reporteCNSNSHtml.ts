/**
 * Fase 8b — reporte CNSNS en HTML a partir del PROYECTO (CNSNSAutoReportDialog).
 *
 * Antes el HTML traía resultados fijos («300 Gy/semana», «6 MV», «7/7 barreras cumplen») que no provenían del plano.
 * Ahora cada sección sale del `FloorPlan`: fuentes (modalidad y carga), barreras con el espesor requerido que calculó el
 * motor (`requiredThickness_mm`, NCRP 147/151 según `calculationTrace`), el instalado y la verificación de
 * `verificarBarrera` (cumple sólo si instalado ≥ requerido). Los campos que el proyecto no tiene se dejan «Por
 * completar»; sin barreras calculadas no se genera reporte.
 */
import type { FloorPlan } from '@/types/radshield';
import { verificarBarrera } from './verificacionBlindaje';

export type SeccionReporte = 'cover' | 'objective' | 'facility' | 'methodology' | 'sources' | 'barriers' | 'results' | 'conclusions' | 'references';

const esc = (t: unknown) => String(t ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
const mm = (v: number | null) => (v === null ? '—' : v.toFixed(1));

/** Barreras calculadas por el motor (traza de cálculo); el requerido que trae un DXF desde la capa no cuenta. */
export function barrerasCalculadas(plano: FloorPlan) {
  return plano.barriers.filter((b) => b.calculationTrace && verificarBarrera(b).estado !== 'SIN_CALCULO');
}

export function generarReporteCNSNSHtml(plano: FloorPlan, secciones: ReadonlySet<SeccionReporte>, fecha = new Date()): string | null {
  const calculadas = barrerasCalculadas(plano);
  if (!calculadas.length) return null;
  const filas = plano.barriers.map((b) => ({ b, v: verificarBarrera(b) }));
  const cumplen = filas.filter((f) => f.v.estado === 'CUMPLE').length;
  const metodos = Array.from(new Set(plano.barriers.map((b) => b.calculationTrace?.standard).filter(Boolean)));
  const hoy = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const s: string[] = [];
  const on = (k: SeccionReporte) => secciones.has(k);
  if (on('cover')) s.push(`<h1>Identificación</h1><table><tr><th>Campo</th><th>Valor</th></tr>
<tr><td>Proyecto</td><td>${esc(plano.name)}</td></tr><tr><td>Fecha</td><td>${esc(hoy)}</td></tr>
<tr><td>Institución</td><td>Por completar</td></tr><tr><td>Responsable</td><td>Por completar</td></tr>
<tr><td>Normativa del cálculo</td><td>${esc(metodos.join(', ') || 'Por completar')}</td></tr></table>`);
  if (on('objective')) s.push(`<h1>Objetivo</h1><p>Determinar y verificar los espesores de blindaje de las ${plano.barriers.length} barreras del proyecto «${esc(plano.name)}» para que la dosis en cada área no supere su objetivo de diseño P.</p>`);
  if (on('facility')) s.push(`<h1>Instalación</h1><p>Escala del plano: ${plano.scale_m_per_pixel} m/px; ${plano.sources.length} fuente(s) y ${plano.barriers.length} barrera(s).</p>`);
  if (on('methodology')) s.push(`<h1>Metodología</h1><p>Espesores calculados con el motor normativo de RadShield-MX (${esc(metodos.join(', ') || '—')}): NCRP 147 (Ec. 4.3/4.4/4.8, Tablas 4.5, 4.7, B.1 y C.1) para rayos X diagnósticos y NCRP 151 (Ec. 2.1, 2.3, 2.7, 2.8; Tablas B.2, B.5a, B.7) para megavoltaje. Una barrera cumple sólo si su espesor instalado es mayor o igual al requerido.</p>`);
  if (on('sources')) s.push(`<h1>Fuentes</h1><table><tr><th>Fuente</th><th>Modalidad</th><th>Carga</th></tr>${plano.sources.map((f) => `<tr><td>${esc(f.name)}</td><td>${esc(f.modality?.name ?? f.modality?.id)}</td><td>${esc(f.workloadValue)} ${esc(f.workloadUnit)}</td></tr>`).join('') || '<tr><td colspan="3">Sin fuentes</td></tr>'}</table>`);
  if (on('barriers') || on('results')) s.push(`<h1>Barreras y verificación</h1><table><tr><th>Barrera</th><th>Tipo</th><th>Material</th><th>P (mSv/sem)</th><th>T</th><th>Requerido (mm)</th><th>Instalado (mm)</th><th>Estado</th></tr>${filas.map(({ b, v }) => `<tr><td>${esc(b.name)}</td><td>${esc(b.barrierType)}</td><td>${esc(b.materialCode)}</td><td>${b.designGoal_mSv_per_wk}</td><td>${b.occupancyFactor}</td><td>${mm(v.requerido_mm)}</td><td>${mm(v.instalado_mm)}</td><td class="${v.estado === 'CUMPLE' ? 'pass' : 'fail'}">${esc(v.estado.replace('_', ' '))}</td></tr>`).join('')}</table>`);
  if (on('conclusions')) s.push(`<h1>Conclusiones</h1><p>${cumplen} de ${plano.barriers.length} barreras cumplen (espesor instalado ≥ requerido). ${cumplen < plano.barriers.length ? 'Las barreras restantes requieren más blindaje, el espesor instalado o el cálculo.' : ''}</p>`);
  if (on('references')) s.push('<h1>Referencias</h1><ul><li>NCRP Report No. 147 (2004)</li><li>NCRP Report No. 151 (2005)</li><li>AAPM TG-108 (2006)</li></ul>');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Memoria de cálculo de blindaje — ${esc(plano.name)}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}h1{font-size:16px;color:#1a365d;border-bottom:1px solid #cbd5e0}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}.pass{color:#16a34a;font-weight:bold}.fail{color:#dc2626;font-weight:bold}</style>
</head><body><p style="color:#b91c1c;font-size:11px">PRELIMINAR — generado por RadShield-MX a partir del proyecto; revisar y firmar por el responsable.</p>${s.join('\n')}</body></html>`;
}
