/**
 * Objetivos de diseño de blindaje unificados (decisión del propietario): área controlada 0.1 mSv/semana y área no
 * controlada 0.02 mSv/semana (NCRP 147 §1.3 / NCRP 151 §1.2), con una sola fuente: src/lib/limitesDosis.ts.
 *
 * Además de las constantes, recorre código, prompts, scripts de ingesta, manuales y documentación: falla si un objetivo
 * semanal asociado a «controlada / controlled / POE / ocupacional» no es 0.1 mSv/semana (p. ej. los 0.4 mSv/semana que
 * traían los scripts de ingesta) o si uno asociado a «no controlada / público» no es 0.02 mSv/semana.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LIMITES_DOSIS,
  P_CONTROLADA_mSv_semana,
  P_CONTROLADA_uSv_semana,
  P_NO_CONTROLADA_mSv_semana,
  P_NO_CONTROLADA_uSv_semana,
} from '@/lib/limitesDosis';
import { NCRP_DESIGN_GOALS } from '@/lib/ncrpOccupancy';
import { OBJETIVOS_DISENO, OBJETIVO_GAMMA_KNIFE } from '@/lib/calculadorasNormativas';
import { NM_ROOM_CONFIGS } from '@/lib/nuclearMedicine';
import { DESIGN_GOALS } from '@/types/radshield';

const RAIZ = join(__dirname, '..', '..', '..');
/** Carpetas y archivos de la raíz que se revisan (código, prompts, ingesta, manuales y documentación). */
const RUTAS = ['src', 'api', 'scripts', 'db', 'contracts', 'docs', 'site', 'public', 'data'];
const EXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|txt|py)$/i;
const OMITIR = new Set(['node_modules', '.git', 'dist', '__tests__', 'tests']);

function archivos(dir: string): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(dir);
  } catch {
    return [];
  }
  return entradas.flatMap((n) => {
    if (OMITIR.has(n)) return [];
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return archivos(p);
    return EXT.test(n) && !/\.(test|spec)\./.test(n) && n !== 'package-lock.json' ? [p] : [];
  });
}

function todos(): string[] {
  const raiz = readdirSync(RAIZ)
    .filter((n) => /\.(md|html)$/i.test(n))
    .map((n) => join(RAIZ, n));
  return [...raiz, ...RUTAS.flatMap((r) => archivos(join(RAIZ, r)))];
}

// «0.4 mSv/week», «400 μSv/semana», «0,1 mSv semana-1», «0.02 mSv/sem», «20 uSv/wk»…
const VALOR_SEMANAL =
  /(\d+(?:[.,]\d+)?)\s*(mSv|µSv|μSv|uSv)\s*(?:(?:\/|por|per)\s*(?:semana|sem|week|wk)\b|\s+semana-1)/gi;
const NO_CONTROLADA = /no[ -]controlad\w*|uncontrolled|non-controlled|p[uú]blic\w*/gi;
const CONTROLADA = /controlad|controlled|\bPOE\b|ocupacional|occupational|\bstaff\b|trabajador/i;
/** Citas históricas permitidas: el expediente Gamma Knife (P = 400 μSv/semana) y errores ya corregidos. */
const CITA_HISTORICA = /expediente|antes dec[ií]a|corregido|ya no llama|P\/10/i;

interface Hallazgo {
  archivo: string;
  valor_mSv: number;
  contexto: string;
}

function revisar(archivo: string, texto: string): Hallazgo[] {
  const out: Hallazgo[] = [];
  for (const m of texto.matchAll(VALOR_SEMANAL)) {
    const i = m.index ?? 0;
    const ini = Math.max(texto.lastIndexOf('\n', i) + 1, i - 60);
    let finLinea = texto.indexOf('\n', i);
    if (finLinea < 0) finLinea = texto.length;
    // Las interpolaciones de la fuente única (${P_CONTROLADA_mSv_semana}…) no cuentan como palabra clave.
    const ventana = texto.slice(ini, Math.min(finLinea, i + m[0].length + 25)).replace(/\$\{[^}]*\}?/g, '');
    if (CITA_HISTORICA.test(ventana)) continue;
    const esNoControlada = new RegExp(NO_CONTROLADA.source, 'i').test(ventana);
    const esControlada = CONTROLADA.test(ventana.replace(NO_CONTROLADA, ''));
    if (!esControlada && !esNoControlada) continue;
    const num = parseFloat(m[1].replace(',', '.'));
    const valor_mSv = /^m/i.test(m[2]) ? num : num / 1000;
    const igual = (x: number) => Math.abs(valor_mSv - x) < 1e-9;
    const ok = (esControlada && igual(P_CONTROLADA_mSv_semana)) || (esNoControlada && igual(P_NO_CONTROLADA_mSv_semana));
    if (!ok) out.push({ archivo, valor_mSv, contexto: ventana.trim() });
  }
  return out;
}

describe('objetivos de diseño de blindaje: una sola fuente (limitesDosis.ts)', () => {
  it('controlada 0.1 mSv/semana y no controlada 0.02 mSv/semana (NCRP 147 §1.3 / NCRP 151 §1.2)', () => {
    expect(LIMITES_DOSIS.objetivosDiseno.controlada_mSv_semana).toBe(0.1);
    expect(LIMITES_DOSIS.objetivosDiseno.noControlada_mSv_semana).toBe(0.02);
    expect(P_CONTROLADA_mSv_semana).toBe(0.1);
    expect(P_NO_CONTROLADA_mSv_semana).toBe(0.02);
    expect(P_CONTROLADA_uSv_semana).toBe(100);
    expect(P_NO_CONTROLADA_uSv_semana).toBe(20);
  });

  it('las tablas derivadas usan la fuente única', () => {
    expect(NCRP_DESIGN_GOALS).toEqual({
      controlled: P_CONTROLADA_mSv_semana,
      uncontrolled: P_NO_CONTROLADA_mSv_semana,
      public: P_NO_CONTROLADA_mSv_semana,
      staff: P_CONTROLADA_mSv_semana,
      console: P_NO_CONTROLADA_mSv_semana,
    });
    expect(OBJETIVOS_DISENO.map((o) => o.P_mSv_semana)).toEqual([P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana]);
    expect(OBJETIVO_GAMMA_KNIFE.P_mSv_semana).toBe(P_CONTROLADA_mSv_semana);
    expect(DESIGN_GOALS.find((g) => g.description === 'Área controlada')?.value).toBe(P_CONTROLADA_mSv_semana);
    expect(DESIGN_GOALS.find((g) => g.description === 'Área pública')?.value).toBe(P_NO_CONTROLADA_mSv_semana);
    for (const r of NM_ROOM_CONFIGS) expect([P_CONTROLADA_uSv_semana, P_NO_CONTROLADA_uSv_semana]).toContain(r.designGoal_uSv_week);
  });

  it('ningún agente o API trae un objetivo P numérico propio (antes default 0.4 en agent-router)', () => {
    const literal = /goalDose(?:Un)?[Cc]ontrolled\s*:\s*(?:z\.number\(\)\.default\(\s*)?\d/;
    const conLiteral = todos()
      .filter((p) => /\.(ts|tsx)$/.test(p) && literal.test(readFileSync(p, 'utf-8')))
      .map((p) => relative(RAIZ, p));
    expect(conLiteral).toEqual([]);
  });

  it('código, prompts, ingesta, manuales y documentación no citan otro objetivo semanal (0.4, 0.5, 1 mSv/semana…)', () => {
    const hallazgos = todos().flatMap((p) => revisar(relative(RAIZ, p), readFileSync(p, 'utf-8')));
    expect(hallazgos).toEqual([]);
  });

  it('el detector reconoce los valores incoherentes que había antes', () => {
    expect(revisar('x', 'Controlled areas (áreas controladas): P = 0.4 mSv/week')).toHaveLength(1);
    expect(revisar('x', 'NCRP 151: 0.02 mSv/sem (público), 0.4 mSv/sem (personal controlado)')).toHaveLength(1);
    expect(revisar('x', 'Área controlada: 1 mSv/semana')).toHaveLength(1);
    expect(revisar('x', 'POE: 500 μSv/semana')).toHaveLength(1);
    expect(revisar('x', 'Reference dose limit: 0.02 mSv/wk for controlled areas')).toHaveLength(1);
    expect(revisar('x', 'Public area: 7.5 μSv/week')).toHaveLength(1);
    expect(revisar('x', 'controlada 0.1 mSv/semana; no controlada 0.02 mSv/semana')).toEqual([]);
    expect(revisar('x', 'el expediente usa P = 400 μSv/semana')).toEqual([]);
  });
});
