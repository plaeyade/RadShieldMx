// Blindaje de neutrones para > 10 MV (NCRP 151 §2.4, Tabla B.9).
//
// Fase 8a: antes se multiplicaba el número de TVL (log10 H/P) por la HVL del material (espesor ≈ 3.3× menor), con un
// «rendimiento» de 0.08–0.25 Sv/Gy sin fuente (NCRP 151 Tabla B.9: H₀ ≤ 2 mSv/Gy a 1.41 m) y captura gamma = 30 % fija.
// Ahora: H₀ máximo de la Tabla B.9 para la energía (`fuenteNeutronesConservadora`), ley del inverso del cuadrado desde
// 1.41 m (sin atenuación del laberinto: cota superior) y polietileno borado de la puerta con `puerta()` (§7.1.13:
// neutrones a P/2, TVL de 45 mm). Los rayos gamma de captura y los fotones dependen del laberinto: diálogo «maze».
import { fuenteNeutronesConservadora, puerta, TVL_PUERTA } from '@/lib/ncrp151Laberinto';

export interface NeutronConfig {
  energy_MeV: number;        // 10, 15, 18, 20, 25 MV (Tabla B.9)
  workload_Gy_week: number;  // carga de fuga W_L (Gy/semana en el isocentro)
  distance_m: number;        // blanco → punto (m)
  target_mSv_week: number;
  hasBoratedPolyethylene?: boolean;
  hasWaterBarrier?: boolean;
}

export interface NeutronResult {
  H0_mSv_Gy: number;
  neutronDose_mSv_week: number;
  gammaCaptureDose_mSv_week: number | null;
  totalDose_mSv_week: number;
  compliant: boolean;
  bpeThickness_mm: number;
  waterThickness_mm: number | null;
  concreteExtra_mm: number | null;
  doorRecommendation: string;
  nota: string;
}

export function calculateNeutronShielding(config: NeutronConfig): NeutronResult {
  const mv = [10, 15, 18, 20, 24, 25].reduce((a, e) => (e <= config.energy_MeV ? e : a), 10);
  const f = fuenteNeutronesConservadora(mv === 24 ? 25 : mv);
  const d = Math.max(config.distance_m, 0.3);
  const Hn_Sv = config.workload_Gy_week * f.H0_mSv_Gy * 1e-3 * (1.41 / d) ** 2;
  const P_Sv = config.target_mSv_week / 1000;
  const door = puerta(P_Sv, { neutrones: Hn_Sv, captura: 0, fotones: 0 });
  return {
    H0_mSv_Gy: f.H0_mSv_Gy,
    neutronDose_mSv_week: Hn_Sv * 1000,
    gammaCaptureDose_mSv_week: null,
    totalDose_mSv_week: Hn_Sv * 1000,
    compliant: Hn_Sv <= P_Sv / 2,
    bpeThickness_mm: door.bpe_mm,
    waterThickness_mm: null,
    concreteExtra_mm: null,
    doorRecommendation: door.bpe_mm > 0
      ? `Puerta con ${Math.ceil(door.bpe_mm / 5) * 5} mm de polietileno borado al 5 % (TVL ${TVL_PUERTA.bpe_neutrones_mm} mm, neutrones a P/2) + plomo para la captura gamma`
      : 'Los neutrones directos ya están por debajo de P/2 sin polietileno borado.',
    nota: `${f.nota} Cota superior sin atenuación del laberinto; para captura gamma, fotones y Kersey/Wu–McGinley use «Laberinto y puerta».`,
  };
}
