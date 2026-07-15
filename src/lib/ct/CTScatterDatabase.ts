/**
 * CTScatterDatabase — VV-03
 * Funciones puras, tipos inmutables, lookup O(1) con Map.
 * SOLID: SRP (cada funcion una operacion), OCP (scanner extensible),
 * DIP (motor inyecta config).
 */

export interface CTModel {
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly kappa100: number;
  readonly kappa125: number;
  readonly kappa140: number;
  readonly tvlConcreteMm: number; // TVL concreto 125kVp
}

const SCANNERS: readonly CTModel[] = [
  // GE
  { brand: 'GE', model: 'LightSpeed VCT',     year: 2005, kappa100: 8.6e-5, kappa125: 9.2e-5, kappa140: 9.8e-5, tvlConcreteMm: 26 },
  { brand: 'GE', model: 'Discovery CT750 HD',  year: 2010, kappa100: 7.8e-5, kappa125: 8.4e-5, kappa140: 9.0e-5, tvlConcreteMm: 26 },
  { brand: 'GE', model: 'Revolution CT',       year: 2016, kappa100: 6.6e-5, kappa125: 7.1e-5, kappa140: 7.7e-5, tvlConcreteMm: 26 },
  { brand: 'GE', model: 'Revolution Apex',     year: 2020, kappa100: 6.1e-5, kappa125: 6.6e-5, kappa140: 7.2e-5, tvlConcreteMm: 26 },
  // Siemens
  { brand: 'Siemens', model: 'Sensation 64',   year: 2004, kappa100: 9.1e-5, kappa125: 9.8e-5, kappa140: 10.5e-5, tvlConcreteMm: 26 },
  { brand: 'Siemens', model: 'Definition AS+', year: 2008, kappa100: 8.8e-5, kappa125: 9.5e-5, kappa140: 10.2e-5, tvlConcreteMm: 26 },
  { brand: 'Siemens', model: 'Somatom Force',  year: 2014, kappa100: 7.9e-5, kappa125: 8.5e-5, kappa140: 9.2e-5, tvlConcreteMm: 26 },
  { brand: 'Siemens', model: 'Somatom X.cite', year: 2020, kappa100: 7.1e-5, kappa125: 7.7e-5, kappa140: 8.3e-5, tvlConcreteMm: 26 },
  // Philips
  { brand: 'Philips', model: 'Brilliance 64',  year: 2005, kappa100: 9.5e-5, kappa125: 10.2e-5, kappa140: 10.9e-5, tvlConcreteMm: 26 },
  { brand: 'Philips', model: 'iCT 256',        year: 2010, kappa100: 8.9e-5, kappa125: 9.6e-5, kappa140: 10.3e-5, tvlConcreteMm: 26 },
  { brand: 'Philips', model: 'IQon Spectral',  year: 2016, kappa100: 8.2e-5, kappa125: 8.8e-5, kappa140: 9.5e-5, tvlConcreteMm: 26 },
  { brand: 'Philips', model: 'Incisive CT',    year: 2019, kappa100: 7.6e-5, kappa125: 8.2e-5, kappa140: 8.9e-5, tvlConcreteMm: 26 },
  // Canon
  { brand: 'Canon', model: 'Aquilion 64',      year: 2004, kappa100: 9.3e-5, kappa125: 10.0e-5, kappa140: 10.7e-5, tvlConcreteMm: 26 },
  { brand: 'Canon', model: 'Aquilion ONE',     year: 2007, kappa100: 8.7e-5, kappa125: 9.4e-5, kappa140: 10.1e-5, tvlConcreteMm: 26 },
  { brand: 'Canon', model: 'Aquilion Prime',   year: 2013, kappa100: 8.1e-5, kappa125: 8.7e-5, kappa140: 9.4e-5, tvlConcreteMm: 26 },
  { brand: 'Canon', model: 'Aquilion Exceed',  year: 2021, kappa100: 6.9e-5, kappa125: 7.5e-5, kappa140: 8.1e-5, tvlConcreteMm: 26 },
];

// ─── Lookup O(1) con Map (index pre-calculado) ───
const byModelMap = new Map(SCANNERS.map(s => [s.model.toLowerCase(), s]));
const byBrandMap = new Map<string, CTModel[]>();
for (const s of SCANNERS) {
  const arr = byBrandMap.get(s.brand) ?? [];
  arr.push(s);
  byBrandMap.set(s.brand, arr);
}

// ─── Funciones puras ───
export const findScanner = (query: string): CTModel | undefined =>
  byModelMap.get(query.toLowerCase()) ??
  SCANNERS.find(s => s.model.toLowerCase().includes(query.toLowerCase()));

export const getKappa = (m: CTModel, kVp: number): number =>
  kVp <= 105 ? m.kappa100 : kVp <= 135
    ? m.kappa125 + (m.kappa140 - m.kappa125) * (kVp - 125) / 15
    : m.kappa140;

export const getByBrand = (brand: string): readonly CTModel[] => byBrandMap.get(brand) ?? [];
export const getAllBrands = (): readonly string[] => [...byBrandMap.keys()];
export const getAllScanners = (): readonly CTModel[] => SCANNERS;

// ─── Calculo pura: blindaje CT ───
export interface CTShieldInput {
  readonly scanner: CTModel;
  readonly kVp: number;
  readonly patientsPerWeek: number;
  readonly avgDlp_mGycm: number;
  readonly distanceM: number;
  readonly designGoal_uSv: number;
}

export interface CTShieldResult {
  readonly weeklyKerma_uSv: number;
  readonly passes: boolean;
  readonly requiredConcreteMm: number;
  readonly requiredLeadMm: number;
  readonly tvlNeeded: number;
}

export const calculateCTShielding = (i: CTShieldInput): CTShieldResult => {
  const kappa = getKappa(i.scanner, i.kVp);
  const weeklyKerma = i.avgDlp_mGycm * i.patientsPerWeek * kappa / (i.distanceM ** 2);
  const ratio = weeklyKerma > 0 ? i.designGoal_uSv / weeklyKerma : Infinity;
  const tvlNeeded = ratio > 0 && ratio < 1 ? Math.ceil(-Math.log10(ratio)) : 0;
  return {
    weeklyKerma_uSv: weeklyKerma,
    passes: weeklyKerma <= i.designGoal_uSv,
    requiredConcreteMm: tvlNeeded * i.scanner.tvlConcreteMm,
    requiredLeadMm: tvlNeeded * 0.27,
    tvlNeeded,
  };
};
