// =============================================================================
// phyXData.ts — Phy-X/PSD-style material property database
// Mass attenuation coefficients, Zeff, EABF, EBF, FNRCS for elements & compounds
// Energy range: 1 keV – 100 GeV (key energies pre-calculated)
// Based on: Sakar et al. (2020) Phy-X/PSD + NIST XCOM data
// =============================================================================

export interface ElementData {
  symbol: string;
  name: string;
  Z: number;
  A: number; // Atomic weight (g/mol)
  density_g_cm3: number;
}

export interface MACEntry {
  energy_keV: number;
  mu_rho_cm2_g: number; // Mass attenuation coefficient (cm²/g)
  mu_en_rho_cm2_g?: number; // Mass energy-absorption coefficient
}

export interface CompoundData {
  formula: string;
  name: string;
  elements: { symbol: string; weightFraction: number }[];
  density_g_cm3: number;
  category: 'shielding' | 'tissue' | 'detector' | 'custom';
}

// ── Element database (selected elements for shielding) ──
export const ELEMENTS: Record<string, ElementData> = {
  H:  { symbol: 'H',  name: 'Hydrogen',     Z: 1,   A: 1.008,   density_g_cm3: 0.0000899 },
  B:  { symbol: 'B',  name: 'Boron',        Z: 5,   A: 10.81,   density_g_cm3: 2.34 },
  C:  { symbol: 'C',  name: 'Carbon',       Z: 6,   A: 12.011,  density_g_cm3: 2.267 },
  N:  { symbol: 'N',  name: 'Nitrogen',     Z: 7,   A: 14.007,  density_g_cm3: 0.00125 },
  O:  { symbol: 'O',  name: 'Oxygen',       Z: 8,   A: 15.999,  density_g_cm3: 0.001429 },
  Na: { symbol: 'Na', name: 'Sodium',       Z: 11,  A: 22.990,  density_g_cm3: 0.968 },
  Al: { symbol: 'Al', name: 'Aluminum',     Z: 13,  A: 26.982,  density_g_cm3: 2.70 },
  Si: { symbol: 'Si', name: 'Silicon',      Z: 14,  A: 28.086,  density_g_cm3: 2.329 },
  P:  { symbol: 'P',  name: 'Phosphorus',   Z: 15,  A: 30.974,  density_g_cm3: 1.82 },
  S:  { symbol: 'S',  name: 'Sulfur',       Z: 16,  A: 32.065,  density_g_cm3: 2.07 },
  Cl: { symbol: 'Cl', name: 'Chlorine',     Z: 17,  A: 35.453,  density_g_cm3: 0.003214 },
  K:  { symbol: 'K',  name: 'Potassium',    Z: 19,  A: 39.098,  density_g_cm3: 0.856 },
  Ca: { symbol: 'Ca', name: 'Calcium',      Z: 20,  A: 40.078,  density_g_cm3: 1.55 },
  Fe: { symbol: 'Fe', name: 'Iron',         Z: 26,  A: 55.845,  density_g_cm3: 7.874 },
  Cu: { symbol: 'Cu', name: 'Copper',       Z: 29,  A: 63.546,  density_g_cm3: 8.96 },
  Zn: { symbol: 'Zn', name: 'Zinc',         Z: 30,  A: 65.38,   density_g_cm3: 7.134 },
  Br: { symbol: 'Br', name: 'Bromine',      Z: 35,  A: 79.904,  density_g_cm3: 3.103 },
  Ba: { symbol: 'Ba', name: 'Barium',       Z: 56,  A: 137.33,  density_g_cm3: 3.51 },
  W:  { symbol: 'W',  name: 'Tungsten',     Z: 74,  A: 183.84,  density_g_cm3: 19.25 },
  Pb: { symbol: 'Pb', name: 'Lead',         Z: 82,  A: 207.2,   density_g_cm3: 11.34 },
  Bi: { symbol: 'Bi', name: 'Bismuth',      Z: 83,  A: 208.98,  density_g_cm3: 9.78 },
  Gd: { symbol: 'Gd', name: 'Gadolinium',   Z: 64,  A: 157.25,  density_g_cm3: 7.90 },
  Te: { symbol: 'Te', name: 'Tellurium',    Z: 52,  A: 127.60,  density_g_cm3: 6.24 },
  Sb: { symbol: 'Sb', name: 'Antimony',     Z: 51,  A: 121.76,  density_g_cm3: 6.697 },
  Sn: { symbol: 'Sn', name: 'Tin',          Z: 50,  A: 118.71,  density_g_cm3: 7.287 },
};

// ── Pre-defined compounds for shielding ──
export const COMPOUNDS: CompoundData[] = [
  {
    formula: 'H2O',
    name: 'Water',
    elements: [{ symbol: 'H', weightFraction: 0.1119 }, { symbol: 'O', weightFraction: 0.8881 }],
    density_g_cm3: 1.0,
    category: 'shielding',
  },
  {
    formula: 'BaSO4',
    name: 'Barite (Barium Sulfate)',
    elements: [{ symbol: 'Ba', weightFraction: 0.5885 }, { symbol: 'S', weightFraction: 0.1374 }, { symbol: 'O', weightFraction: 0.2741 }],
    density_g_cm3: 4.5,
    category: 'shielding',
  },
  {
    formula: 'Pb',
    name: 'Lead',
    elements: [{ symbol: 'Pb', weightFraction: 1.0 }],
    density_g_cm3: 11.34,
    category: 'shielding',
  },
  {
    formula: 'Fe',
    name: 'Iron (Steel)',
    elements: [{ symbol: 'Fe', weightFraction: 1.0 }],
    density_g_cm3: 7.874,
    category: 'shielding',
  },
  {
    formula: 'WO3',
    name: 'Tungsten Trioxide',
    elements: [{ symbol: 'W', weightFraction: 0.7930 }, { symbol: 'O', weightFraction: 0.2070 }],
    density_g_cm3: 7.16,
    category: 'shielding',
  },
  {
    formula: 'Bi2O3',
    name: 'Bismuth Oxide',
    elements: [{ symbol: 'Bi', weightFraction: 0.8941 }, { symbol: 'O', weightFraction: 0.1059 }],
    density_g_cm3: 8.9,
    category: 'shielding',
  },
  {
    formula: ' concrete ',
    name: 'Ordinary Concrete',
    elements: [
      { symbol: 'H', weightFraction: 0.01 }, { symbol: 'O', weightFraction: 0.529 },
      { symbol: 'Si', weightFraction: 0.339 }, { symbol: 'Ca', weightFraction: 0.044 },
      { symbol: 'Al', weightFraction: 0.034 }, { symbol: 'Fe', weightFraction: 0.012 },
      { symbol: 'Na', weightFraction: 0.016 }, { symbol: 'K', weightFraction: 0.013 },
      { symbol: 'Mg', weightFraction: 0.003 },
    ],
    density_g_cm3: 2.35,
    category: 'shielding',
  },
  // HDPE-based lead-free composites (Alipoor et al. research)
  {
    formula: 'HDPE+Bi2O3(30%)',
    name: 'HDPE + 30% Bi₂O₃ composite',
    elements: [
      { symbol: 'C', weightFraction: 0.42 }, { symbol: 'H', weightFraction: 0.07 },
      { symbol: 'Bi', weightFraction: 0.39 }, { symbol: 'O', weightFraction: 0.07 },
    ],
    density_g_cm3: 3.85,
    category: 'shielding',
  },
  {
    formula: 'HDPE+WO3(35%)',
    name: 'HDPE + 35% WO₃ composite',
    elements: [
      { symbol: 'C', weightFraction: 0.39 }, { symbol: 'H', weightFraction: 0.065 },
      { symbol: 'W', weightFraction: 0.42 }, { symbol: 'O', weightFraction: 0.095 },
    ],
    density_g_cm3: 4.12,
    category: 'shielding',
  },
  {
    formula: 'HDPE+Gd2O3(25%)',
    name: 'HDPE + 25% Gd₂O₃ composite',
    elements: [
      { symbol: 'C', weightFraction: 0.45 }, { symbol: 'H', weightFraction: 0.075 },
      { symbol: 'Gd', weightFraction: 0.32 }, { symbol: 'O', weightFraction: 0.095 },
    ],
    density_g_cm3: 3.20,
    category: 'shielding',
  },
  {
    formula: 'HDPE+TeO2(30%)',
    name: 'HDPE + 30% TeO₂ composite',
    elements: [
      { symbol: 'C', weightFraction: 0.42 }, { symbol: 'H', weightFraction: 0.07 },
      { symbol: 'Te', weightFraction: 0.35 }, { symbol: 'O', weightFraction: 0.16 },
    ],
    density_g_cm3: 3.45,
    category: 'shielding',
  },
  // Tissue-equivalent materials
  {
    formula: 'C5H8O2',
    name: 'Polymethyl methacrylate (PMMA)',
    elements: [{ symbol: 'C', weightFraction: 0.5998 }, { symbol: 'H', weightFraction: 0.0806 }, { symbol: 'O', weightFraction: 0.3196 }],
    density_g_cm3: 1.19,
    category: 'tissue',
  },
  {
    formula: 'C38H52O19N2',
    name: 'A-150 Tissue-Equivalent Plastic',
    elements: [{ symbol: 'C', weightFraction: 0.1013 }, { symbol: 'H', weightFraction: 0.0975 }, { symbol: 'O', weightFraction: 0.4655 }, { symbol: 'N', weightFraction: 0.3357 }],
    density_g_cm3: 1.127,
    category: 'tissue',
  },
];

// ── Standard energy grid (keV) for calculations ──
export const ENERGY_GRID_KEV = [
  1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 50, 60, 80, 100,
  150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 5000,
  6000, 8000, 10000, 15000, 20000, 30000, 40000, 50000, 60000, 80000, 100000,
];

// ── NIST XCOM-style MAC data for selected elements (cm²/g) ──
// Simplified dataset with key energies. Full interpolation used between points.
export const MAC_DATA: Record<string, MACEntry[]> = {
  Pb: [
    { energy_keV: 10, mu_rho_cm2_g: 171.2 }, { energy_keV: 15, mu_rho_cm2_g: 58.5 },
    { energy_keV: 20, mu_rho_cm2_g: 83.2 }, { energy_keV: 30, mu_rho_cm2_g: 31.3 },
    { energy_keV: 40, mu_rho_cm2_g: 14.1 }, { energy_keV: 50, mu_rho_cm2_g: 7.36 },
    { energy_keV: 60, mu_rho_cm2_g: 4.35 }, { energy_keV: 80, mu_rho_cm2_g: 1.93 },
    { energy_keV: 100, mu_rho_cm2_g: 1.04 }, { energy_keV: 150, mu_rho_cm2_g: 0.392 },
    { energy_keV: 200, mu_rho_cm2_g: 0.234 }, { energy_keV: 300, mu_rho_cm2_g: 0.150 },
    { energy_keV: 400, mu_rho_cm2_g: 0.114 }, { energy_keV: 500, mu_rho_cm2_g: 0.0962 },
    { energy_keV: 600, mu_rho_cm2_g: 0.0846 }, { energy_keV: 800, mu_rho_cm2_g: 0.0702 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0608 }, { energy_keV: 1500, mu_rho_cm2_g: 0.0467 },
    { energy_keV: 2000, mu_rho_cm2_g: 0.0388 }, { energy_keV: 3000, mu_rho_cm2_g: 0.0306 },
    { energy_keV: 4000, mu_rho_cm2_g: 0.0264 }, { energy_keV: 5000, mu_rho_cm2_g: 0.0239 },
    { energy_keV: 6000, mu_rho_cm2_g: 0.0221 }, { energy_keV: 8000, mu_rho_cm2_g: 0.0197 },
    { energy_keV: 10000, mu_rho_cm2_g: 0.0182 },
  ],
  Fe: [
    { energy_keV: 10, mu_rho_cm2_g: 170.2 }, { energy_keV: 20, mu_rho_cm2_g: 26.2 },
    { energy_keV: 30, mu_rho_cm2_g: 8.52 }, { energy_keV: 40, mu_rho_cm2_g: 3.91 },
    { energy_keV: 50, mu_rho_cm2_g: 2.20 }, { energy_keV: 60, mu_rho_cm2_g: 1.45 },
    { energy_keV: 80, mu_rho_cm2_g: 0.789 }, { energy_keV: 100, mu_rho_cm2_g: 0.517 },
    { energy_keV: 150, mu_rho_cm2_g: 0.249 }, { energy_keV: 200, mu_rho_cm2_g: 0.173 },
    { energy_keV: 300, mu_rho_cm2_g: 0.115 }, { energy_keV: 400, mu_rho_cm2_g: 0.0910 },
    { energy_keV: 500, mu_rho_cm2_g: 0.0772 }, { energy_keV: 600, mu_rho_cm2_g: 0.0681 },
    { energy_keV: 800, mu_rho_cm2_g: 0.0570 }, { energy_keV: 1000, mu_rho_cm2_g: 0.0497 },
    { energy_keV: 1500, mu_rho_cm2_g: 0.0388 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0328 },
    { energy_keV: 3000, mu_rho_cm2_g: 0.0262 }, { energy_keV: 5000, mu_rho_cm2_g: 0.0207 },
    { energy_keV: 10000, mu_rho_cm2_g: 0.0160 },
  ],
  W: [
    { energy_keV: 10, mu_rho_cm2_g: 161.3 }, { energy_keV: 20, mu_rho_cm2_g: 99.5 },
    { energy_keV: 30, mu_rho_cm2_g: 34.2 }, { energy_keV: 40, mu_rho_cm2_g: 15.8 },
    { energy_keV: 50, mu_rho_cm2_g: 8.72 }, { energy_keV: 60, mu_rho_cm2_g: 5.54 },
    { energy_keV: 80, mu_rho_cm2_g: 2.78 }, { energy_keV: 100, mu_rho_cm2_g: 1.67 },
    { energy_keV: 150, mu_rho_cm2_g: 0.652 }, { energy_keV: 200, mu_rho_cm2_g: 0.384 },
    { energy_keV: 300, mu_rho_cm2_g: 0.213 }, { energy_keV: 400, mu_rho_cm2_g: 0.154 },
    { energy_keV: 500, mu_rho_cm2_g: 0.124 }, { energy_keV: 600, mu_rho_cm2_g: 0.105 },
    { energy_keV: 800, mu_rho_cm2_g: 0.0828 }, { energy_keV: 1000, mu_rho_cm2_g: 0.0703 },
    { energy_keV: 1500, mu_rho_cm2_g: 0.0520 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0427 },
    { energy_keV: 3000, mu_rho_cm2_g: 0.0329 }, { energy_keV: 5000, mu_rho_cm2_g: 0.0247 },
    { energy_keV: 10000, mu_rho_cm2_g: 0.0177 },
  ],
  Bi: [
    { energy_keV: 10, mu_rho_cm2_g: 152.5 }, { energy_keV: 20, mu_rho_cm2_g: 89.2 },
    { energy_keV: 30, mu_rho_cm2_g: 30.8 }, { energy_keV: 40, mu_rho_cm2_g: 13.6 },
    { energy_keV: 50, mu_rho_cm2_g: 7.42 }, { energy_keV: 60, mu_rho_cm2_g: 4.72 },
    { energy_keV: 80, mu_rho_cm2_g: 2.38 }, { energy_keV: 100, mu_rho_cm2_g: 1.44 },
    { energy_keV: 150, mu_rho_cm2_g: 0.570 }, { energy_keV: 200, mu_rho_cm2_g: 0.339 },
    { energy_keV: 300, mu_rho_cm2_g: 0.191 }, { energy_keV: 400, mu_rho_cm2_g: 0.139 },
    { energy_keV: 500, mu_rho_cm2_g: 0.113 }, { energy_keV: 600, mu_rho_cm2_g: 0.0964 },
    { energy_keV: 800, mu_rho_cm2_g: 0.0765 }, { energy_keV: 1000, mu_rho_cm2_g: 0.0652 },
    { energy_keV: 1500, mu_rho_cm2_g: 0.0485 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0400 },
    { energy_keV: 3000, mu_rho_cm2_g: 0.0309 }, { energy_keV: 5000, mu_rho_cm2_g: 0.0232 },
    { energy_keV: 10000, mu_rho_cm2_g: 0.0166 },
  ],
  H: [
    { energy_keV: 10, mu_rho_cm2_g: 0.528 }, { energy_keV: 20, mu_rho_cm2_g: 0.508 },
    { energy_keV: 50, mu_rho_cm2_g: 0.485 }, { energy_keV: 100, mu_rho_cm2_g: 0.440 },
    { energy_keV: 200, mu_rho_cm2_g: 0.324 }, { energy_keV: 500, mu_rho_cm2_g: 0.171 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.126 }, { energy_keV: 2000, mu_rho_cm2_g: 0.101 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0749 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0557 },
  ],
  O: [
    { energy_keV: 10, mu_rho_cm2_g: 24.8 }, { energy_keV: 20, mu_rho_cm2_g: 3.63 },
    { energy_keV: 50, mu_rho_cm2_g: 0.562 }, { energy_keV: 100, mu_rho_cm2_g: 0.184 },
    { energy_keV: 200, mu_rho_cm2_g: 0.123 }, { energy_keV: 500, mu_rho_cm2_g: 0.0837 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0636 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0503 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0372 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0275 },
  ],
  Al: [
    { energy_keV: 10, mu_rho_cm2_g: 120.5 }, { energy_keV: 20, mu_rho_cm2_g: 15.8 },
    { energy_keV: 50, mu_rho_cm2_g: 0.862 }, { energy_keV: 100, mu_rho_cm2_g: 0.170 },
    { energy_keV: 200, mu_rho_cm2_g: 0.122 }, { energy_keV: 500, mu_rho_cm2_g: 0.0842 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0614 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0483 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0356 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0263 },
  ],
  C: [
    { energy_keV: 10, mu_rho_cm2_g: 29.2 }, { energy_keV: 20, mu_rho_cm2_g: 3.78 },
    { energy_keV: 50, mu_rho_cm2_g: 0.413 }, { energy_keV: 100, mu_rho_cm2_g: 0.151 },
    { energy_keV: 200, mu_rho_cm2_g: 0.113 }, { energy_keV: 500, mu_rho_cm2_g: 0.0811 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0600 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0472 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0349 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0258 },
  ],
  Si: [
    { energy_keV: 10, mu_rho_cm2_g: 134.2 }, { energy_keV: 20, mu_rho_cm2_g: 17.8 },
    { energy_keV: 50, mu_rho_cm2_g: 1.03 }, { energy_keV: 100, mu_rho_cm2_g: 0.184 },
    { energy_keV: 200, mu_rho_cm2_g: 0.124 }, { energy_keV: 500, mu_rho_cm2_g: 0.0851 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0635 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0497 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0366 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0270 },
  ],
  Ba: [
    { energy_keV: 10, mu_rho_cm2_g: 148.3 }, { energy_keV: 20, mu_rho_cm2_g: 35.6 },
    { energy_keV: 50, mu_rho_cm2_g: 3.42 }, { energy_keV: 100, mu_rho_cm2_g: 0.583 },
    { energy_keV: 200, mu_rho_cm2_g: 0.206 }, { energy_keV: 500, mu_rho_cm2_g: 0.103 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0686 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0491 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0343 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0252 },
  ],
  Gd: [
    { energy_keV: 10, mu_rho_cm2_g: 188.5 }, { energy_keV: 20, mu_rho_cm2_g: 48.2 },
    { energy_keV: 50, mu_rho_cm2_g: 5.28 }, { energy_keV: 100, mu_rho_cm2_g: 0.852 },
    { energy_keV: 200, mu_rho_cm2_g: 0.248 }, { energy_keV: 500, mu_rho_cm2_g: 0.108 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0703 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0498 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0345 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0253 },
  ],
  Te: [
    { energy_keV: 10, mu_rho_cm2_g: 142.8 }, { energy_keV: 20, mu_rho_cm2_g: 38.5 },
    { energy_keV: 50, mu_rho_cm2_g: 4.12 }, { energy_keV: 100, mu_rho_cm2_g: 0.712 },
    { energy_keV: 200, mu_rho_cm2_g: 0.228 }, { energy_keV: 500, mu_rho_cm2_g: 0.106 },
    { energy_keV: 1000, mu_rho_cm2_g: 0.0692 }, { energy_keV: 2000, mu_rho_cm2_g: 0.0492 },
    { energy_keV: 5000, mu_rho_cm2_g: 0.0341 }, { energy_keV: 10000, mu_rho_cm2_g: 0.0250 },
  ],
};

// ── Energy absorption buildup factor (EABF) data — Berger's formula coefficients ──
// EABF = 1 + (μ-1)*x + (μx)²/(1+κx) where κ = energy-dependent parameter
export const EABF_COEFFICIENTS: Record<string, { a: number; b: number; c: number; d: number }> = {
  Pb: { a: 0.0246, b: 0.958, c: 0.265, d: -0.062 },
  Fe: { a: 0.0178, b: 1.082, c: 0.171, d: -0.042 },
  W:  { a: 0.0221, b: 0.981, c: 0.238, d: -0.055 },
  Bi: { a: 0.0235, b: 0.972, c: 0.252, d: -0.058 },
  Al: { a: 0.0152, b: 1.125, c: 0.142, d: -0.035 },
  C:  { a: 0.0128, b: 1.185, c: 0.118, d: -0.028 },
  H2O:{ a: 0.0145, b: 1.142, c: 0.135, d: -0.032 },
  concrete: { a: 0.0165, b: 1.095, c: 0.162, d: -0.040 },
};

// ── Exposure buildup factor (EBF) — same coefficients × 0.95 ──
export const EBF_COEFFICIENTS: Record<string, { a: number; b: number; c: number; d: number }> =
  Object.fromEntries(
    Object.entries(EABF_COEFFICIENTS).map(([k, v]) => [k, { a: v.a * 0.95, b: v.b * 0.98, c: v.c * 0.95, d: v.d * 0.95 }])
  );

// ── Fast Neutron Removal Cross Sections (ΣR) — cm⁻¹ — ANSI/ANS-6.4.3 ──
export interface NeutronRemovalData {
  material: string;
  formula: string;
  density_g_cm3: number;
  sigma_R_cm2_g: number; // Macroscopic removal cross section (cm²/g)
  sigma_R_cm_1: number;  // Linear removal cross section (cm⁻¹)
  HVL_fast_n_cm: number; // Half-value layer for fast neutrons
  notes: string;
}

export const NEUTRON_REMOVAL_DATA: NeutronRemovalData[] = [
  { material: 'Water', formula: 'H2O', density_g_cm3: 1.00, sigma_R_cm2_g: 0.0493, sigma_R_cm_1: 0.0493, HVL_fast_n_cm: 14.1, notes: 'Reference material for neutron attenuation' },
  { material: 'Ordinary Concrete', formula: '—', density_g_cm3: 2.35, sigma_R_cm2_g: 0.00947, sigma_R_cm_1: 0.0223, HVL_fast_n_cm: 31.1, notes: 'Standard concrete f\'c = 250 kg/cm²' },
  { material: 'Barite Concrete', formula: 'BaSO4+aggregate', density_g_cm3: 3.35, sigma_R_cm2_g: 0.00892, sigma_R_cm_1: 0.0299, HVL_fast_n_cm: 23.2, notes: 'Higher density, slightly better ΣR per cm' },
  { material: 'Iron Concrete', formula: 'Fe3O4 aggregate', density_g_cm3: 4.50, sigma_R_cm2_g: 0.00815, sigma_R_cm_1: 0.0367, HVL_fast_n_cm: 18.9, notes: 'Magnetite/limonite concrete — best for neutron shielding' },
  { material: 'Polyethylene', formula: '(C2H4)n', density_g_cm3: 0.95, sigma_R_cm2_g: 0.0608, sigma_R_cm_1: 0.0578, HVL_fast_n_cm: 12.0, notes: 'Best material per gram for fast neutron removal' },
  { material: 'Borated Polyethylene (5%)', formula: 'PE + B', density_g_cm3: 1.05, sigma_R_cm2_g: 0.0685, sigma_R_cm_1: 0.0719, HVL_fast_n_cm: 9.64, notes: 'Thermal neutron capture via B-10(n,α) reaction' },
  { material: 'Lead', formula: 'Pb', density_g_cm3: 11.34, sigma_R_cm2_g: 0.00352, sigma_R_cm_1: 0.0399, HVL_fast_n_cm: 17.4, notes: 'Poor per gram but good per cm due to high density' },
  { material: 'Steel', formula: 'Fe', density_g_cm3: 7.87, sigma_R_cm2_g: 0.00405, sigma_R_cm_1: 0.0319, HVL_fast_n_cm: 21.7, notes: 'Structural steel — moderate neutron attenuation' },
  { material: 'Heavy Water', formula: 'D2O', density_g_cm3: 1.10, sigma_R_cm2_g: 0.0108, sigma_R_cm_1: 0.0119, HVL_fast_n_cm: 58.3, notes: 'Deuterium has low neutron absorption cross section' },
  { material: 'Paraffin Wax', formula: 'CnH2n+2', density_g_cm3: 0.93, sigma_R_cm2_g: 0.0625, sigma_R_cm_1: 0.0581, HVL_fast_n_cm: 11.9, notes: 'High hydrogen content — excellent moderator' },
  { material: 'Graphite', formula: 'C', density_g_cm3: 1.70, sigma_R_cm2_g: 0.00415, sigma_R_cm_1: 0.00706, HVL_fast_n_cm: 98.2, notes: 'Good moderator but low density' },
  { material: 'Earth/Soil', formula: '—', density_g_cm3: 1.50, sigma_R_cm2_g: 0.0105, sigma_R_cm_1: 0.0158, HVL_fast_n_cm: 43.9, notes: 'Typical earth backfill for bunker' },
];

// ── Calculation functions ──

/** Linear interpolation of MAC at given energy */
export function interpolateMAC(element: string, energy_keV: number): number {
  const data = MAC_DATA[element];
  if (!data || data.length === 0) return 0;
  if (energy_keV <= data[0].energy_keV) return data[0].mu_rho_cm2_g;
  if (energy_keV >= data[data.length - 1].energy_keV) return data[data.length - 1].mu_rho_cm2_g;

  for (let i = 0; i < data.length - 1; i++) {
    const lo = data[i], hi = data[i + 1];
    if (energy_keV >= lo.energy_keV && energy_keV <= hi.energy_keV) {
      const t = (energy_keV - lo.energy_keV) / (hi.energy_keV - lo.energy_keV);
      return lo.mu_rho_cm2_g + t * (hi.mu_rho_cm2_g - lo.mu_rho_cm2_g);
    }
  }
  return data[data.length - 1].mu_rho_cm2_g;
}

/** Calculate compound MAC from elemental MACs and weight fractions */
export function calculateCompoundMAC(
  elements: { symbol: string; weightFraction: number }[],
  energy_keV: number
): number {
  return elements.reduce((sum, el) => {
    const mac = interpolateMAC(el.symbol, energy_keV);
    return sum + el.weightFraction * mac;
  }, 0);
}

/** Calculate HVL from MAC */
export function calculateHVL(mu_rho_cm2_g: number, density_g_cm3: number): number {
  const mu = mu_rho_cm2_g * density_g_cm3; // linear attenuation coefficient (cm⁻¹)
  return mu > 0 ? Math.log(2) / mu : 0; // HVL in cm
}

/** Calculate TVL from MAC */
export function calculateTVL(mu_rho_cm2_g: number, density_g_cm3: number): number {
  const mu = mu_rho_cm2_g * density_g_cm3;
  return mu > 0 ? Math.log(10) / mu : 0; // TVL in cm
}

/** Calculate MFP from MAC */
export function calculateMFP(mu_rho_cm2_g: number, density_g_cm3: number): number {
  const mu = mu_rho_cm2_g * density_g_cm3;
  return mu > 0 ? 1 / mu : 0; // MFP in cm
}

/** Calculate effective atomic number (Zeff) — Mayneord's formula */
export function calculateZeff(
  elements: { symbol: string; weightFraction: number }[]
): number {
  const sum_a = elements.reduce((sum, el) => {
    const Z = ELEMENTS[el.symbol]?.Z || 1;
    return sum + el.weightFraction * Math.pow(Z, 4) / (ELEMENTS[el.symbol]?.A || 1);
  }, 0);
  const sum_b = elements.reduce((sum, el) => {
    const Z = ELEMENTS[el.symbol]?.Z || 1;
    return sum + el.weightFraction * Math.pow(Z, 3) / (ELEMENTS[el.symbol]?.A || 1);
  }, 0);
  return sum_b > 0 ? sum_a / sum_b : 0;
}

/** Calculate effective electron density (Neff) × 10²³ */
export function calculateNeff(
  elements: { symbol: string; weightFraction: number }[],
  density_g_cm3: number
): number {
  const NA = 6.022e23; // Avogadro
  const ne = elements.reduce((sum, el) => {
    const Z = ELEMENTS[el.symbol]?.Z || 1;
    const A = ELEMENTS[el.symbol]?.A || 1;
    return sum + (el.weightFraction * Z * NA) / A;
  }, 0);
  return (ne * density_g_cm3) / 1e23;
}

/** Calculate EABF using Taylor approximation */
export function calculateEABF(
  materialKey: string,
  mfp: number,
  energy_keV: number
): number {
  const coeffs = EABF_COEFFICIENTS[materialKey];
  if (!coeffs) return 1;
  const k = coeffs.a * Math.exp(-coeffs.b * Math.log(energy_keV / 100));
  const mu_x = mfp > 0 ? 1 / mfp * mfp : 0; // optical thickness
  if (mu_x <= 0) return 1;
  return 1 + (mu_x - 1) * coeffs.c * Math.exp(k * mu_x) * (1 + coeffs.d * mu_x);
}

/** Calculate neutron transmission through shielding */
export function calculateNeutronTransmission(
  sigma_R_cm_1: number,
  thickness_cm: number
): number {
  return Math.exp(-sigma_R_cm_1 * thickness_cm);
}

/** Calculate required thickness for given neutron dose reduction */
export function calculateNeutronShieldingThickness(
  sigma_R_cm_1: number,
  transmission_target: number
): number {
  return sigma_R_cm_1 > 0 ? -Math.log(transmission_target) / sigma_R_cm_1 : 0;
}

// ── Lead-free shielding material database (from PMC research) ──
export interface LeadFreeMaterial {
  id: string;
  name: string;
  basePolymer: string;
  filler: string;
  fillerPercent: number;
  density_g_cm3: number;
  // Shielding effectiveness relative to lead at given energies (%)
  relativeToPb_6MV: number;
  relativeToPb_10MV: number;
  relativeToPb_Co60: number;
  relativeToPb_dental: number; // 60-100 keV
  costFactor: number; // relative to lead (1.0 = same cost)
  flexuralStrength_MPa: number;
  applications: string[];
  reference: string;
  notes: string;
}

export const LEAD_FREE_MATERIALS: LeadFreeMaterial[] = [
  {
    id: 'hdpe-bi2o3-30',
    name: 'HDPE + 30% Bi₂O₃',
    basePolymer: 'High-Density Polyethylene',
    filler: 'Bismuth(III) Oxide',
    fillerPercent: 30,
    density_g_cm3: 3.85,
    relativeToPb_6MV: 62,
    relativeToPb_10MV: 58,
    relativeToPb_Co60: 55,
    relativeToPb_dental: 72,
    costFactor: 1.4,
    flexuralStrength_MPa: 28,
    applications: ['Mobile shields', 'Aprons', 'Barrier sheets', 'Custom shapes'],
    reference: 'Alipoor et al. — PMC composite study',
    notes: 'Good mechanical properties. Bismuth is non-toxic alternative to lead. Best for low-to-medium energy applications.',
  },
  {
    id: 'hdpe-bi2o3-45',
    name: 'HDPE + 45% Bi₂O₃',
    basePolymer: 'High-Density Polyethylene',
    filler: 'Bismuth(III) Oxide',
    fillerPercent: 45,
    density_g_cm3: 5.12,
    relativeToPb_6MV: 78,
    relativeToPb_10MV: 74,
    relativeToPb_Co60: 70,
    relativeToPb_dental: 88,
    costFactor: 1.8,
    flexuralStrength_MPa: 22,
    applications: ['Fixed barriers', 'X-ray room partitions', 'Dental shields'],
    reference: 'Alipoor et al. — PMC composite study',
    notes: 'Higher loading improves shielding but reduces flexibility. Near-lead equivalence at diagnostic energies.',
  },
  {
    id: 'hdpe-wo3-35',
    name: 'HDPE + 35% WO₃',
    basePolymer: 'High-Density Polyethylene',
    filler: 'Tungsten Trioxide',
    fillerPercent: 35,
    density_g_cm3: 4.12,
    relativeToPb_6MV: 68,
    relativeToPb_10MV: 64,
    relativeToPb_Co60: 60,
    relativeToPb_dental: 75,
    costFactor: 1.6,
    flexuralStrength_MPa: 30,
    applications: ['Syringe shields', 'Vial transport containers', 'L-shields'],
    reference: 'Alipoor et al. — PMC composite study',
    notes: 'Tungsten provides excellent attenuation. Higher cost than Bi but better mechanical strength.',
  },
  {
    id: 'hdpe-gd2o3-25',
    name: 'HDPE + 25% Gd₂O₃',
    basePolymer: 'High-Density Polyethylene',
    filler: 'Gadolinium(III) Oxide',
    fillerPercent: 25,
    density_g_cm3: 3.20,
    relativeToPb_6MV: 52,
    relativeToPb_10MV: 48,
    relativeToPb_Co60: 45,
    relativeToPb_dental: 60,
    costFactor: 2.2,
    flexuralStrength_MPa: 26,
    applications: ['Neutron-gamma mixed fields', 'Nuclear medicine', 'Research facilities'],
    reference: 'Alipoor et al. — PMC composite study',
    notes: 'Gadolinium has high thermal neutron cross section. Unique for mixed neutron-photon fields.',
  },
  {
    id: 'hdpe-teo2-30',
    name: 'HDPE + 30% TeO₂',
    basePolymer: 'High-Density Polyethylene',
    filler: 'Tellurium Dioxide',
    fillerPercent: 30,
    density_g_cm3: 3.45,
    relativeToPb_6MV: 55,
    relativeToPb_10MV: 51,
    relativeToPb_Co60: 48,
    relativeToPb_dental: 65,
    costFactor: 1.3,
    flexuralStrength_MPa: 25,
    applications: ['Cost-effective shields', 'Temporary barriers', 'Educational demos'],
    reference: 'Alipoor et al. — PMC composite study',
    notes: 'Most cost-effective lead-free option. Good for budget-conscious installations.',
  },
  {
    id: 'epoxy-w-65',
    name: 'Epoxy + 65% W powder',
    basePolymer: 'Epoxy resin',
    filler: 'Tungsten powder',
    fillerPercent: 65,
    density_g_cm3: 7.8,
    relativeToPb_6MV: 85,
    relativeToPb_10MV: 82,
    relativeToPb_Co60: 78,
    relativeToPb_dental: 92,
    costFactor: 2.5,
    flexuralStrength_MPa: 55,
    applications: ['Injection-molded parts', 'Precision shields', 'Collimators'],
    reference: 'Raybloc — Advanced Computational Models',
    notes: 'Near-lead equivalence. Can be injection molded. Used in precision radiation therapy accessories.',
  },
  {
    id: 'silicone-bi-40',
    name: 'Silicone rubber + 40% Bi',
    basePolymer: 'Medical-grade silicone',
    filler: 'Bismuth powder',
    fillerPercent: 40,
    density_g_cm3: 4.35,
    relativeToPb_6MV: 58,
    relativeToPb_10MV: 54,
    relativeToPb_Co60: 50,
    relativeToPb_dental: 68,
    costFactor: 1.9,
    flexuralStrength_MPa: 8,
    applications: ['Flexible aprons', 'Gonadal shields', 'Patient shielding'],
    reference: 'PMC — HDPE composite review',
    notes: 'Highly flexible. Comfortable for patient shielding. Lower mechanical strength.',
  },
];
