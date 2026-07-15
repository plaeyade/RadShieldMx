/**
 * BatchProcessor — Procesamiento por lotes de calculos de blindaje
 * Para archivos grandes: streaming lazy, sin cargar todo en memoria.
 * SOLID: SRP (pipeline pura), DIP (motor inyectable), OCP (extensible).
 * 
 * Uso con Polars (Python) para archivos >1GB:
 *   import polars as pl
 *   df = pl.scan_csv('pacientes.csv')  # lazy
 *   result = df.with_columns(shielding=calculate_batch(col('dlp'))).collect(streaming=True)
 */

// ─── Tipos ───
export interface BatchInput {
  readonly id: string;
  readonly modality: 'CT' | 'XR' | 'PET' | 'SPECT' | 'LINAC';
  readonly energy_kVp_or_MV: number;
  readonly workload: number;
  readonly distance_m: number;
  readonly fieldSize_cm2: number;
  readonly designGoal_uSv_week: number;
  readonly material: 'lead' | 'concrete' | 'steel' | 'gypsum';
}

export interface BatchResult {
  readonly id: string;
  readonly modality: string;
  readonly transmission: number;
  readonly thicknessMm: number;
  readonly thicknessMmPbEq: number;
  readonly passes: boolean;
  readonly weeklyDose_uSv: number;
}

// ─── Motor de calculo puro (DIP: inyectable) ───
export interface ShieldingEngine {
  readonly tvlFor: (material: string, energy: number, modality: string) => number;
  readonly alphaBetaGammaFor: (energy: number) => readonly [number, number, number];
}

// ─── Motor por defecto (NCRP 147/151) ───
export const DEFAULT_ENGINE: ShieldingEngine = {
  tvlFor: (mat, e, mod) => {
    const key = `${mat}_${mod}_${e}`;
    const table: Record<string, number> = {
      'lead_XR_100': 0.25, 'lead_XR_125': 0.27, 'lead_XR_150': 0.29,
      'concrete_XR_100': 20, 'concrete_XR_125': 26, 'concrete_XR_150': 30,
      'lead_LINAC_6': 11, 'lead_LINAC_10': 13, 'lead_LINAC_15': 15,
      'concrete_LINAC_6': 370, 'concrete_LINAC_10': 410, 'concrete_LINAC_15': 440,
      'lead_PET_511': 5.8, 'concrete_PET_511': 170,
    };
    return table[key] ?? 26; // fallback concrete 125kVp
  },
  alphaBetaGammaFor: (e) => {
    const table: Record<number, readonly [number, number, number]> = {
      100: [2.50, 18.6, 0.0380], 125: [2.194, 7.16, 0.0563], 150: [1.71, 3.57, 0.0664],
    };
    return table[e] ?? [2.194, 7.16, 0.0563];
  },
};

// ─── Funciones puras ───
const archerB = (a: number, b: number, g: number, x: number): number =>
  ((1 + b / a) * Math.exp(a * g * x) - b / a) ** (-1 / g);

const calcRow = (inp: BatchInput, eng: ShieldingEngine): BatchResult => {
  const tvl = eng.tvlFor(inp.material, inp.energy_kVp_or_MV, inp.modality);
  const [a, b, g] = inp.modality === 'XR' ? eng.alphaBetaGammaFor(inp.energy_kVp_or_MV) : [0, 0, 0];
  const kerma = inp.modality === 'LINAC'
    ? inp.workload * 1000 / (inp.distance_m ** 2) // Gy·m²/week → uSv/week
    : inp.workload * inp.fieldSize_cm2 / (400 * inp.distance_m ** 2); // NCRP 147
  const trans = inp.modality === 'XR' ? archerB(a, b, g, tvl) : Math.pow(10, -1);
  const dose = kerma * trans;
  const passes = dose <= inp.designGoal_uSv_week;
  const tvlNeeded = dose > 0 && !passes ? Math.ceil(-Math.log10(inp.designGoal_uSv_week / dose)) : 0;
  return {
    id: inp.id,
    modality: inp.modality,
    transmission: trans,
    thicknessMm: tvlNeeded * tvl,
    thicknessMmPbEq: tvlNeeded * (inp.modality === 'LINAC' ? 13 : 0.27),
    passes,
    weeklyDose_uSv: dose,
  };
};

// ─── API publica ───
export const processBatch = (
  inputs: readonly BatchInput[],
  engine: ShieldingEngine = DEFAULT_ENGINE
): readonly BatchResult[] => inputs.map(i => calcRow(i, engine));

// ─── Streaming: procesa chunks sin cargar todo ───
export async function* processBatchStream(
  inputs: AsyncIterable<BatchInput>,
  engine: ShieldingEngine = DEFAULT_ENGINE
): AsyncGenerator<BatchResult> {
  for await (const inp of inputs) {
    yield calcRow(inp, engine);
  }
}

// ─── CSV parser streaming (para archivos grandes) ───
export const parseCSVStream = async function* (stream: ReadableStream<string>): AsyncGenerator<BatchInput> {
  const reader = stream.getReader();
  let buffer = '';
  let headerParsed = false;
  let headers: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (!headerParsed) { headers = cols; headerParsed = true; continue; }
      const get = (h: string) => cols[headers.indexOf(h)] ?? '';
      yield {
        id: get('id') || String(Math.random()).slice(2, 8),
        modality: (get('modality') || 'CT') as BatchInput['modality'],
        energy_kVp_or_MV: +(get('energy') || 125),
        workload: +(get('workload') || 500),
        distance_m: +(get('distance') || 2.5),
        fieldSize_cm2: +(get('fieldSize') || 1000),
        designGoal_uSv_week: +(get('designGoal') || 100),
        material: (get('material') || 'concrete') as BatchInput['material'],
      };
    }
  }
};

// ─── Ejemplo Polars (Python) ───
/*
import polars as pl
from batch_processor import process_batch

# Lazy scan de CSV grande (>1GB)
df = pl.scan_csv('hospital_data.csv')

# Procesamiento streaming
result = (
    df
    .with_columns([
        pl.col('dlp') * pl.col('patients') * 9e-5 / (pl.col('distance')**2)
        .alias('weekly_kerma')
    ])
    .filter(pl.col('weekly_kerma') > 0)
    .collect(streaming=True)  # no carga todo en RAM
)

# Export
result.write_csv('shielding_results.csv')
*/
