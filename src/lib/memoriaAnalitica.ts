/**
 * Memoria analítica estructurada del proyecto (contrato `radshield/memoria@1`) para el expediente ante la CNSNS.
 *
 * NOM-040-NUCL-2016 §4.8 define la memoria analítica como el «documento que contiene los cálculos que determinan los
 * blindajes necesarios en las zonas controladas» y §5.2.1 exige demostrar con ella que el POE no rebasa el límite
 * anual del RGSR. La estructura sigue la de las memorias que se presentan a la CNSNS (objetivo y alcance, datos de
 * la instalación, material radiactivo o equipos, condiciones de operación y cargas, ocupación y zonas, blindajes,
 * fundamentos y método, resultados por área y por punto, conclusiones, referencias y anexos de trazas).
 *
 * Todo sale del `FloorPlan` calculado por el motor (`motorProyecto`): no hay valores fijos. Lo que el proyecto no
 * tiene (razón social, domicilio, responsable…) queda «Por completar». El documento es PRELIMINAR hasta que lo revise
 * y firme el responsable.
 */
import type { Barrier, FloorPlan, OccupiedRegion, RadiationSource } from '@/types/radshield';
import { verificarBarrera, type FilaVerificacion } from '@/lib/verificacionBlindaje';
import { codigoCatalogo } from '@/lib/shieldingMath';
import { claveMetodoFuente } from '@/lib/motorProyecto';
import { LIMITES_DOSIS, P_CONTROLADA_mSv_semana } from '@/lib/limitesDosis';
import { NOM_013_NUCL, NOM_033_NUCL, NOM_040_NUCL } from '@/lib/normativaMx';

export const CONTRATO_MEMORIA = 'radshield/memoria@1' as const;
export const POR_COMPLETAR = 'Por completar';

/** Datos que el proyecto no contiene y que captura el usuario (todos opcionales). */
export interface DatosInstalacion {
  nombre?: string;
  razonSocial?: string;
  domicilio?: string;
  responsableSR?: string;
  elaboro?: string;
  revision?: string;
  tipoInstalacion?: string;
  clasificacionNOM003?: string;
  actividades?: string[];
  colindancias?: { orientacion: string; descripcion: string }[];
  nivel?: string;
}

export interface FuenteMemoria {
  id: string;
  nombre: string;
  modalidad: string;
  modalidadId: string;
  categoria: string;
  metodo: string;
  posicion_m: { x: number; y: number };
  alturaFuente_m: number;
  carga: string;
  detalleCarga: Record<string, number | string>;
}

export interface OcupacionMemoria {
  id: string;
  area: string;
  tipo: 'barrera' | 'region';
  zona: 'controlada' | 'no controlada';
  T: number;
  P_mSv_semana: number;
  P_T_mSv_semana: number;
  /** P/T repartido en 40 h/semana (informativo, como el límite derivado de las memorias). */
  limiteDerivado_uSv_h: number;
}

export interface BarreraMemoria {
  id: string;
  punto: string;
  area: string;
  nombre: string;
  tipo: Barrier['barrierType'];
  material: string;
  U: number;
  T: number;
  P_mSv_semana: number;
  zona: 'controlada' | 'no controlada';
  kermaSinBlindaje_mSv_semana: number | null;
  requerido_mm: number | null;
  requeridoPb_mm: number | null;
  requeridoConcreto_mm: number | null;
  instalado_mm: number | null;
  margen_mm: number | null;
  estado: FilaVerificacion['estado'];
  nota: string;
  norma: string;
  formula: string;
  hipotesis: string[];
  avisos: string[];
}

export interface MemoriaAnalitica {
  contrato: typeof CONTRATO_MEMORIA;
  id: string;
  sha256: string;
  origen: { proyecto: string; app: string; fecha: string; motor: string };
  preliminar: true;
  instalacion: Required<Omit<DatosInstalacion, 'colindancias' | 'actividades'>> & {
    actividades: string[];
    colindancias: { orientacion: string; descripcion: string }[];
    escala_m_px: number;
  };
  objetivo: string;
  alcance: string;
  marcoNormativo: { id: string; titulo: string; aplica: string }[];
  fuentes: FuenteMemoria[];
  ocupaciones: OcupacionMemoria[];
  criterios: { id: string; texto: string }[];
  metodo: { normas: string[]; descripcion: string[]; formulas: { id: string; expresion: string; donde: string }[] };
  barreras: BarreraMemoria[];
  resultadosPorArea: { area: string; barreras: string[]; cumplen: number; total: number; conclusion: string }[];
  conclusiones: { cumplen: number; total: number; sinCalculo: number; sinEspesor: number; noCumplen: number; textos: string[] };
  referencias: { id: string; cita: string }[];
  advertencias: string[];
}

// ─── SHA-256 (síncrono, sin dependencias, para el sello del contenido canónico) ───
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export function sha256Hex(texto: string): string {
  const datos = new TextEncoder().encode(texto);
  const largo = datos.length;
  const bloques = Math.ceil((largo + 9) / 64);
  const buf = new Uint8Array(bloques * 64);
  buf.set(datos);
  buf[largo] = 0x80;
  const bits = largo * 8;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 8, Math.floor(bits / 2 ** 32));
  dv.setUint32(buf.length - 4, bits >>> 0);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < bloques; i++) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i * 64 + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  return [...h].map((x) => x.toString(16).padStart(8, '0')).join('');
}

/** JSON canónico: claves ordenadas, sin espacios. */
export function jsonCanonico(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(jsonCanonico).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${jsonCanonico(o[k])}`).join(',')}}`;
}

// ─── Utilidades ───
const n = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const zonaDe = (P: number): 'controlada' | 'no controlada' => (P >= P_CONTROLADA_mSv_semana - 1e-12 ? 'controlada' : 'no controlada');
const Tvalido = (T: number) => (Number.isFinite(T) && T > 0 && T <= 1 ? T : 1);

/** Área (sala) de una barrera: el texto antes de « — » en su nombre («Captación — muro norte» → «Captación»). */
export function areaDeBarrera(b: Pick<Barrier, 'name'>): string {
  const m = (b.name || '').split(/\s+[—–]\s+/);
  return m.length > 1 && m[0].trim() ? m[0].trim() : 'General';
}

function cargaDeFuente(s: RadiationSource): { texto: string; detalle: Record<string, number | string> } {
  const d: Record<string, number | string> = {};
  const partes: string[] = [];
  if (s.tg108) {
    const t = s.tg108 as unknown as Record<string, unknown>;
    for (const k of ['A0_MBq', 'pacientesSemana', 'tU_h', 'tI_h', 'sala']) if (t[k] !== undefined) d[k] = t[k] as number | string;
    partes.push(`A₀ = ${t.A0_MBq} MBq, ${t.pacientesSemana} pacientes/semana, captación ${t.tU_h} h${t.tI_h !== undefined ? `, adquisición ${t.tI_h} h` : ''}${t.sala ? ` (${t.sala})` : ''}`);
  } else {
    d.valor = s.workloadValue;
    d.unidad = s.workloadUnit || '';
    partes.push(`${s.workloadValue} ${s.workloadUnit || ''}`.trim());
  }
  if (Number.isFinite(s.useFactor)) { d.U = s.useFactor; if (s.modality.category === 'therapy') partes.push(`U = ${s.useFactor}`); }
  const extra = s as unknown as Record<string, unknown>;
  if (typeof extra.imrtFraction === 'number' && extra.imrtFraction > 0) { d.fraccionIMRT = extra.imrtFraction; d.factorIMRT = Number(extra.imrtFactor ?? 0); partes.push(`IMRT ${Math.round(Number(extra.imrtFraction) * 100)} % × ${extra.imrtFactor}`); }
  if (typeof extra.workloadHoursPerWeek === 'number') { d.horasSemana = extra.workloadHoursPerWeek; partes.push(`${extra.workloadHoursPerWeek} h/semana`); }
  return { texto: partes.join('; '), detalle: d };
}

const DESCRIPCION_NORMA: Record<string, { norma: string; texto: string }> = {
  NCRP147: { norma: 'NCRP 147', texto: 'Rayos X diagnósticos y TC: NCRP 147 (2004). Kerma sin blindaje K = K¹·U·N/d² con las distribuciones de carga de trabajo de las Tablas 4.5 y 4.7; transmisión de Archer B(x) = [(1+β/α)e^{αγx} − β/α]^{−1/γ} (Apéndices B y C) y espesor x = (1/αγ)·ln[(B^{−γ}+β/α)/(1+β/α)].' },
  NCRP151: { norma: 'NCRP 151', texto: 'Teleterapia de megavoltaje: NCRP 151 (2005). Primaria B = P·d²/(W·U·T) (Ec. 2.1), fuga B = P·d²/(10⁻³·W·T) (Ec. 2.8) y dispersión del paciente B = P·d²·d_sca²·400/(a·W·T·F) (Ec. 2.7); n = log₁₀(1/B), x = TVL₁ + (n − 1)·TVLe (Tablas B.2, B.5a, B.7).' },
  TG108: { norma: 'AAPM TG-108', texto: 'PET (511 keV): AAPM TG-108 (2006). Dosis por paciente con decaimiento y atenuación del cuerpo (Ec. 2–3 captación, 9–10 sala de imagen) y transmisión de haz ancho de la Tabla V invertida numéricamente.' },
  GP: { norma: 'ANSI/ANS-6.4.3', texto: 'I-131, Lu-177 y Tc-99m: punto-kernel con espectro completo (líneas ENSDF con Iγ ≥ 1 %) y buildup geométrico-progresivo de ANSI/ANS-6.4.3; el espesor es el mayor entre haz estrecho a la línea más energética y haz ancho del espectro.' },
  COMB: { norma: 'Combinación por fuente', texto: 'Con fuentes de métodos distintos, cada grupo se calcula con su norma y los grupos se combinan sumando sus transmisiones: Σ_g K_g·B_g(x) ≤ P/T, con la curva B_g(x) de cada grupo a P, P/10, P/100 y P/1000.' },
  SERIE: { norma: 'Muros en serie', texto: 'Si otras barreras cortan todos los rayos fuente → punto de una barrera, su espesor (instalado o requerido) se descuenta del total requerido, convertido al material de la barrera por la razón de espesores del mismo grupo (crédito mínimo sobre los rayos). No sustituye el cálculo de laberinto, puerta ni fotoneutrones.' },
  GEN: { norma: 'Punto-kernel', texto: 'Otras fuentes: punto-kernel K = Γ·A/d² con atenuación exponencial por TVL del material.' },
};

function claveNorma(standard: string, formula: string): string[] {
  const s = `${standard} ${formula}`;
  const out: string[] = [];
  if (/COMBINACION_POR_FUENTE/.test(formula)) out.push('COMB');
  if (/NCRP\s?147/i.test(s)) out.push('NCRP147');
  if (/NCRP\s?151/i.test(s)) out.push('NCRP151');
  if (/TG.?108/i.test(s)) out.push('TG108');
  if (/ANS.?6\.4\.3|GP/i.test(s)) out.push('GP');
  if (!out.length) out.push('GEN');
  return out;
}

const REFERENCIAS_BASE: Record<string, string> = {
  [NOM_040_NUCL.clave]: `${NOM_040_NUCL.cita} (§4.8 memoria analítica; §5.2.1).`,
  'NOM-003-NUCL-2021': 'NOM-003-NUCL-2021, «Clasificación de instalaciones que utilizan fuentes abiertas», DOF 12-10-2021 (Tablas A.1–A.3).',
  'NOM-027-NUCL-2021': 'NOM-027-NUCL-2021, «Especificaciones de diseño para las instalaciones radiactivas tipo II clases A, B y C», DOF 03-08-2021.',
  [NOM_013_NUCL.clave]: NOM_013_NUCL.cita,
  'NOM-028-NUCL-2009': 'NOM-028-NUCL-2009, «Manejo de desechos radiactivos en instalaciones radiactivas que utilizan fuentes abiertas», DOF 04-08-2009.',
  [NOM_033_NUCL.clave]: NOM_033_NUCL.cita,
  RGSR: 'Reglamento General de Seguridad Radiológica (DOF 22-11-1988) y sus reformas: límites de equivalente de dosis del POE y del público (verificar el texto vigente).',
  'NCRP-147': 'NCRP Report No. 147, «Structural Shielding Design for Medical X-Ray Imaging Facilities», 2004.',
  'NCRP-151': 'NCRP Report No. 151, «Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities», 2005.',
  'AAPM-TG108': 'Madsen M. T. et al., «AAPM Task Group 108: PET and PET/CT Shielding Requirements», Med. Phys. 33(1):4–15, 2006.',
  'ANS-6.4.3': 'ANSI/ANS-6.4.3-1991, «Gamma-Ray Attenuation Coefficients and Buildup Factors for Engineering Materials».',
  'NCRP-49': 'NCRP Report No. 49, «Structural Shielding Design and Evaluation for Medical Use of X Rays and Gamma Rays of Energies up to 10 MeV», 1976 (factores de ocupación).',
};

export interface OpcionesMemoria {
  fecha?: Date;
  app?: string;
  id?: string;
}

/** Construye la memoria estructurada a partir de un proyecto ya calculado. */
export function construirMemoria(plano: FloorPlan, datos: DatosInstalacion = {}, opciones: OpcionesMemoria = {}): MemoriaAnalitica {
  const fecha = opciones.fecha ?? new Date();
  const fuentes: FuenteMemoria[] = plano.sources.map((s) => {
    const c = cargaDeFuente(s);
    return {
      id: s.id, nombre: s.name, modalidad: s.modality?.name ?? s.modality?.id, modalidadId: s.modality?.id, categoria: s.modality?.category ?? 'desconocida',
      metodo: claveMetodoFuente(s),
      posicion_m: { x: +(s.x * plano.scale_m_per_pixel).toFixed(3), y: +(s.y * plano.scale_m_per_pixel).toFixed(3) },
      alturaFuente_m: s.isocenterHeight_m ?? 0, carga: c.texto, detalleCarga: c.detalle,
    };
  });
  const categorias = new Set(plano.sources.map((s) => s.modality?.category));
  const ids = new Set(plano.sources.map((s) => s.modality?.id));

  // Puntos por área: G1, G2… como en las memorias (letra inicial del área + número).
  const contadores = new Map<string, number>();
  const barreras: BarreraMemoria[] = plano.barriers.map((b) => {
    const v = verificarBarrera(b);
    const r = (b.requiredThickness_mm && typeof b.requiredThickness_mm === 'object' ? b.requiredThickness_mm : {}) as Record<string, number>;
    const area = areaDeBarrera(b);
    const letra = (area.normalize('NFD').replace(/[^A-Za-z]/g, '')[0] || 'P').toUpperCase();
    const k = (contadores.get(letra) ?? 0) + 1;
    contadores.set(letra, k);
    const trace = b.calculationTrace;
    return {
      id: b.id, punto: `${letra}${k}`, area, nombre: b.name, tipo: b.barrierType, material: codigoCatalogo(b.materialCode),
      U: b.useFactor, T: Tvalido(b.occupancyFactor), P_mSv_semana: b.designGoal_mSv_per_wk, zona: zonaDe(b.designGoal_mSv_per_wk),
      kermaSinBlindaje_mSv_semana: n(b.maxKerma), requerido_mm: n(v.requerido_mm),
      requeridoPb_mm: n(r.PB), requeridoConcreto_mm: n(r.CONCRETE235), instalado_mm: n(v.instalado_mm), margen_mm: n(v.margen_mm),
      estado: v.estado, nota: v.nota ?? '', norma: trace?.standard ? String(trace.standard) : '—', formula: trace?.formulaId ?? '—',
      hipotesis: trace?.assumptions ?? [], avisos: (b.calculationWarnings ?? []).map((w) => w.message),
    };
  });

  const ocupaciones: OcupacionMemoria[] = [
    ...plano.barriers.map((b) => ({ id: b.id, area: b.name, tipo: 'barrera' as const, T: Tvalido(b.occupancyFactor), P: b.designGoal_mSv_per_wk })),
    ...(plano.occupiedRegions ?? []).map((o: OccupiedRegion) => ({ id: o.id, area: o.name, tipo: 'region' as const, T: Tvalido(o.occupancyFactor), P: o.designGoal_mSv_per_wk })),
  ].map((o) => ({
    id: o.id, area: o.area, tipo: o.tipo, zona: zonaDe(o.P), T: o.T, P_mSv_semana: o.P, P_T_mSv_semana: o.P / o.T,
    limiteDerivado_uSv_h: +((o.P / o.T) * 1000 / 40).toFixed(4),
  }));

  const normas = new Set<string>();
  for (const b of barreras) for (const k of claveNorma(b.norma, b.formula)) normas.add(k);
  if (barreras.some((b) => b.hipotesis.some((h) => /^Muros en serie/.test(h)))) normas.add('SERIE');

  const marco: MemoriaAnalitica['marcoNormativo'] = [
    { id: 'RGSR', titulo: REFERENCIAS_BASE.RGSR, aplica: 'Límites de dosis del POE y del público.' },
  ];
  const medNuc = categorias.has('nuclear');
  if (medNuc) {
    marco.push({ id: NOM_040_NUCL.clave, titulo: REFERENCIAS_BASE[NOM_040_NUCL.clave], aplica: 'Medicina nuclear: memoria analítica (§4.8) y diseño de la zona controlada (§5.2.1).' });
    marco.push({ id: 'NOM-003-NUCL-2021', titulo: REFERENCIAS_BASE['NOM-003-NUCL-2021'], aplica: 'Clase de la instalación (II-A, II-B o II-C).' });
    marco.push({ id: 'NOM-027-NUCL-2021', titulo: REFERENCIAS_BASE['NOM-027-NUCL-2021'], aplica: 'Especificaciones de diseño de la instalación tipo II.' });
    marco.push({ id: 'NOM-028-NUCL-2009', titulo: REFERENCIAS_BASE['NOM-028-NUCL-2009'], aplica: 'Almacén y manejo de desechos de fuentes abiertas.' });
  }
  if (ids.has('radioiodine-i131') || ids.has('lu177')) marco.push({ id: NOM_013_NUCL.clave, titulo: REFERENCIAS_BASE[NOM_013_NUCL.clave], aplica: 'Egreso de pacientes y necesidad de cuarto de hospitalización.' });
  if (plano.sources.some((s) => /^linac-/.test(s.modality?.id ?? ''))) marco.push({ id: NOM_033_NUCL.clave, titulo: REFERENCIAS_BASE[NOM_033_NUCL.clave], aplica: 'Teleterapia con aceleradores lineales.' });

  const referencias: MemoriaAnalitica['referencias'] = marco.map((m) => ({ id: m.id, cita: m.titulo }));
  const add = (id: string) => { if (!referencias.some((r) => r.id === id)) referencias.push({ id, cita: REFERENCIAS_BASE[id] }); };
  if (normas.has('NCRP147')) add('NCRP-147');
  if (normas.has('NCRP151')) add('NCRP-151');
  if (normas.has('TG108') || medNuc) add('AAPM-TG108');
  if (normas.has('GP')) add('ANS-6.4.3');
  add('NCRP-49');

  const formulas: MemoriaAnalitica['metodo']['formulas'] = [
    { id: 'P/T', expresion: 'K·B(x) ≤ P / T', donde: 'K: kerma sin blindaje en el punto (mSv/semana); B: transmisión del espesor x; P: objetivo de diseño; T: factor de ocupación.' },
    { id: 'H_L', expresion: 'Ḣ_L = (P/T) / 40 h', donde: 'Límite derivado informativo en µSv/h para una semana de 40 h.' },
  ];
  if (normas.has('NCRP151')) formulas.push({ id: 'NCRP151-2.1', expresion: 'B_pri = P·d² / (W·U·T); x = TVL₁ + (log₁₀(1/B) − 1)·TVLe', donde: 'W: carga de trabajo (Gy/semana en el isocentro); d: distancia del blanco al punto (m).' });
  if (normas.has('NCRP147')) formulas.push({ id: 'NCRP147-Archer', expresion: 'B(x) = [(1+β/α)·e^{αγx} − β/α]^{−1/γ}', donde: 'α, β, γ: parámetros de ajuste por material y distribución de carga (NCRP 147, Apéndices B y C).' });
  if (normas.has('TG108')) formulas.push({ id: 'TG108-paciente', expresion: 'D = 0.092·A₀·t·R_t·N / d²  (µSv);  R_t = 1.443·(T½/t)·[1 − exp(−0.693·t/T½)]', donde: 'Γ efectiva = 0.092 µSv·m²/(MBq·h) a 1 m del paciente (incluye la autoatenuación del cuerpo); A₀: actividad administrada; t: estancia; N: pacientes/semana; d: distancia (m).' });
  if (normas.has('GP')) formulas.push({ id: 'GP-punto-kernel', expresion: 'Ḣ(x) = Σ_i Γ_i·A / d² · B_GP,i(μ_i·x) · e^{−μ_i·x}', donde: 'i: líneas gamma con Iγ ≥ 1 %; B_GP: buildup geométrico-progresivo de ANSI/ANS-6.4.3; μ: coeficiente lineal del material.' });
  if (normas.has('COMB')) formulas.push({ id: 'combinacion', expresion: 'Σ_g K_g·B_g(x) ≤ P / T', donde: 'g: grupo de fuentes del mismo método.' });

  const total = barreras.length;
  const cumplen = barreras.filter((b) => b.estado === 'CUMPLE').length;
  const noCumplen = barreras.filter((b) => b.estado === 'NO_CUMPLE').length;
  const sinCalculo = barreras.filter((b) => b.estado === 'SIN_CALCULO').length;
  const sinEspesor = barreras.filter((b) => b.estado === 'SIN_ESPESOR').length;
  const areas = [...new Set(barreras.map((b) => b.area))];
  const resultadosPorArea = areas.map((area) => {
    const bs = barreras.filter((b) => b.area === area);
    const c = bs.filter((b) => b.estado === 'CUMPLE').length;
    const malas = bs.filter((b) => b.estado !== 'CUMPLE');
    return {
      area, barreras: bs.map((b) => b.id), cumplen: c, total: bs.length,
      conclusion: malas.length === 0
        ? `Con los espesores instalados, en los ${bs.length} puntos de «${area}» el equivalente de dosis no supera P/T.`
        : `En «${area}» ${c} de ${bs.length} puntos cumplen; revisar ${malas.map((b) => `${b.punto} (${b.estado.replace('_', ' ').toLowerCase()})`).join(', ')}.`,
    };
  });

  const advertencias = [...new Set(barreras.flatMap((b) => b.avisos))];
  if (plano.sources.some((s) => s.modality?.category === 'cyclotron')) advertencias.push('El ciclotrón no tiene espesor del motor genérico: anexar el cálculo del módulo KIUBE o de Monte Carlo.');
  if (!plano.sources.length) advertencias.push('El proyecto no tiene fuentes: no hay cálculo.');

  const textos = [
    `${cumplen} de ${total} barreras cumplen: el espesor instalado es mayor o igual al requerido por el motor (${MOTOR_TXT}).`,
    ...(noCumplen ? [`${noCumplen} barrera(s) requieren más blindaje que el instalado.`] : []),
    ...(sinEspesor ? [`${sinEspesor} barrera(s) sin espesor instalado declarado: no se puede afirmar el cumplimiento.`] : []),
    ...(sinCalculo ? [`${sinCalculo} barrera(s) sin cálculo.`] : []),
    'Documento PRELIMINAR generado por RadShield-MX a partir del proyecto; debe revisarlo y firmarlo el responsable de la memoria antes de presentarlo a la CNSNS.',
  ];

  const instalacion = {
    nombre: datos.nombre || plano.name || POR_COMPLETAR,
    razonSocial: datos.razonSocial || POR_COMPLETAR,
    domicilio: datos.domicilio || POR_COMPLETAR,
    responsableSR: datos.responsableSR || POR_COMPLETAR,
    elaboro: datos.elaboro || POR_COMPLETAR,
    revision: datos.revision || '0',
    tipoInstalacion: datos.tipoInstalacion || tipoPorFuentes(categorias),
    clasificacionNOM003: datos.clasificacionNOM003 || (medNuc ? POR_COMPLETAR : 'No aplica'),
    nivel: datos.nivel || POR_COMPLETAR,
    actividades: datos.actividades?.length ? datos.actividades : [...new Set(plano.sources.map((s) => s.modality?.name ?? s.modality?.id))],
    colindancias: datos.colindancias ?? [],
    escala_m_px: plano.scale_m_per_pixel,
  };

  const sinSello: Omit<MemoriaAnalitica, 'sha256'> = {
    contrato: CONTRATO_MEMORIA,
    id: opciones.id ?? `memoria-${plano.id}`,
    origen: { proyecto: plano.name, app: opciones.app ?? 'radshield-mx', fecha: fecha.toISOString(), motor: MOTOR_TXT },
    preliminar: true,
    instalacion,
    objetivo: `Demostrar mediante cálculo analítico que los blindajes de «${instalacion.nombre}» mantienen el equivalente de dosis en cada colindancia por debajo de su objetivo de diseño P (zona controlada ${LIMITES_DOSIS.objetivosDiseno.controlada_mSv_semana} mSv/semana; no controlada ${LIMITES_DOSIS.objetivosDiseno.noControlada_mSv_semana} mSv/semana), de modo que el POE y el público no rebasen los límites del RGSR.`,
    alcance: `${plano.sources.length} fuente(s) o equipo(s) y ${total} barrera(s) del plano (escala ${plano.scale_m_per_pixel} m/px). Se evalúa cada barrera en el punto más expuesto a 0.3 m de su cara exterior.`,
    marcoNormativo: marco,
    fuentes,
    ocupaciones,
    criterios: [
      { id: 'P', texto: `Objetivos de diseño P: ${LIMITES_DOSIS.objetivosDiseno.controlada_mSv_semana} mSv/semana en zona controlada (POE) y ${LIMITES_DOSIS.objetivosDiseno.noControlada_mSv_semana} mSv/semana en zona no controlada (público) (${LIMITES_DOSIS.objetivosDiseno.referencia}).` },
      { id: 'T', texto: 'Factores de ocupación T por colindancia (NCRP 147 Tabla 4.1, NCRP 151 Tabla B.1; NCRP 49).' },
      { id: 'punto', texto: 'Punto de cálculo a 0.3 m de la cara exterior de la barrera (más el espesor instalado si está declarado).' },
      { id: 'cumple', texto: 'Una barrera cumple sólo si su espesor instalado es mayor o igual al requerido.' },
    ],
    metodo: {
      normas: [...normas].map((k) => DESCRIPCION_NORMA[k].norma),
      descripcion: [...normas].map((k) => DESCRIPCION_NORMA[k].texto),
      formulas,
    },
    barreras,
    resultadosPorArea,
    conclusiones: { cumplen, total, sinCalculo, sinEspesor, noCumplen, textos },
    referencias,
    advertencias,
  };
  return { ...sinSello, sha256: sha256Hex(jsonCanonico(sinSello)) } as MemoriaAnalitica;
}

const MOTOR_TXT = 'motorProyecto/normativo-v1';

function tipoPorFuentes(c: Set<string | undefined>): string {
  const t: string[] = [];
  if (c.has('nuclear')) t.push('Medicina nuclear');
  if (c.has('therapy')) t.push('Radioterapia');
  if (c.has('diagnostic')) t.push('Radiodiagnóstico');
  if (c.has('cyclotron')) t.push('Ciclotrón y radiofarmacia');
  return t.join(' / ') || POR_COMPLETAR;
}

/** Verifica el sello de una memoria (`sha256` del contenido canónico sin el propio sello). */
export function verificarSelloMemoria(m: MemoriaAnalitica): boolean {
  const { sha256, ...resto } = m;
  return sha256 === sha256Hex(jsonCanonico(resto));
}

/** JSON del contrato `radshield/memoria@1`. */
export function memoriaAJSON(m: MemoriaAnalitica): string {
  return `${JSON.stringify(m, null, 2)}\n`;
}

/** Lee un JSON `radshield/memoria@1`; rechaza versiones mayores desconocidas. */
export function leerMemoriaJSON(texto: string): MemoriaAnalitica {
  const m = JSON.parse(texto) as MemoriaAnalitica;
  const [emisor, resto] = String(m.contrato ?? '').split('/');
  const [nombre, mayor] = (resto ?? '').split('@');
  if (emisor !== 'radshield' || nombre !== 'memoria') throw new Error(`Contrato desconocido: ${m.contrato}`);
  if (mayor !== '1') throw new Error(`Versión mayor no soportada: ${m.contrato}`);
  return m;
}

/** Secciones del documento en orden (las usan los exportadores DOCX y PDF). */
export const SECCIONES_MEMORIA = [
  'I. Objetivo',
  'II. Alcance',
  'III. Datos de la instalación',
  'IV. Marco normativo',
  'V. Fuentes y equipos',
  'VI. Condiciones de operación y cargas de trabajo',
  'VII. Ocupación y clasificación de zonas',
  'VIII. Blindajes (barreras) propuestos',
  'IX. Fundamentos, criterios y método de cálculo',
  'X. Resultados por área y por punto',
  'XI. Conclusiones',
  'XII. Referencias',
  'Anexo A. Trazas de cálculo por barrera',
] as const;
