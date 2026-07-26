/**
 * ═══════════════════════════════════════════════════════════
 * NIST XCOM — X-Ray Attenuation Coefficients Database
 * Data for common shielding materials used in medical physics
 * Source: https://physics.nist.gov/cgi-bin/Xcom/xcom3_1
 * ═══════════════════════════════════════════════════════════
 */

export interface AttenuationEntry {
  energy_MeV: number;
  mu_cm2_per_g: number;      // Mass attenuation coefficient (cm²/g)
  mu_en_cm2_per_g: number;   // Mass energy-absorption coefficient (cm²/g)
  mu_1_per_cm: number;       // Linear attenuation coefficient (1/cm)
  halfValueLayer_mm: number; // HVL in mm
  tenthValueLayer_mm: number; // TVL in mm
}

export function normalizeWeightFractions(components: XcomMixtureComponent[]): XcomMixtureComponent[] {
  const clean = components
    .filter((component) => Number.isFinite(component.weightFraction) && component.weightFraction > 0)
    .map((component) => ({ ...component, weightFraction: Number(component.weightFraction) }));
  const sum = clean.reduce((acc, component) => acc + component.weightFraction, 0);
  if (sum <= 0) return [];
  return clean.map((component) => ({
    ...component,
    weightFraction: component.weightFraction / sum,
  }));
}

export function buildXcomMixtureAttenuation(
  components: XcomMixtureComponent[],
  energy_MeV: number,
  density_g_per_cm3?: number,
): XcomMixtureResult | null {
  if (!Number.isFinite(energy_MeV) || energy_MeV <= 0) return null;

  const normalized = normalizeWeightFractions(components);
  if (!normalized.length) return null;

  const warnings: string[] = [];
  const enriched = normalized.map((component) => {
    const material = findMaterial(component.materialCode);
    const attenuation = interpolateAttenuation(component.materialCode, energy_MeV);
    if (!material || !attenuation) return null;
    return {
      ...component,
      materialName: material.nameEs,
      density_g_per_cm3: material.density_g_per_cm3,
      mu_cm2_per_g: attenuation.mu_cm2_per_g,
    };
  });

  if (enriched.some((item) => item === null)) {
    warnings.push('Uno o mas materiales no tienen datos XCOM locales para esta energia.');
  }

  const valid = enriched.filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (!valid.length) return null;

  const inputSum = components.reduce((acc, component) => acc + (Number.isFinite(component.weightFraction) ? component.weightFraction : 0), 0);
  if (Math.abs(inputSum - 1) > 1e-6) {
    warnings.push('Las fracciones por peso fueron renormalizadas a 1.0, siguiendo el comportamiento descrito para mezclas XCOM.');
  }

  const mu_cm2_per_g = valid.reduce((acc, component) => acc + component.weightFraction * component.mu_cm2_per_g, 0);
  const density =
    Number.isFinite(density_g_per_cm3) && density_g_per_cm3 && density_g_per_cm3 > 0
      ? density_g_per_cm3
      : valid.reduce((acc, component) => acc + component.weightFraction * component.density_g_per_cm3, 0);
  const mu_1_per_cm = mu_cm2_per_g * density;

  if (energy_MeV > 1.5) {
    warnings.push('Para haces MV y geometria broad-beam, use XCOM como apoyo de material; valide TVL clinico con NCRP/IAEA/UAQ.');
  }

  return {
    energy_MeV,
    density_g_per_cm3: density,
    normalizedComponents: valid.map(({ materialCode, weightFraction, materialName, mu_cm2_per_g }) => ({
      materialCode,
      weightFraction,
      materialName,
      mu_cm2_per_g,
    })),
    mu_cm2_per_g,
    mu_1_per_cm,
    halfValueLayer_mm: (Math.log(2) / mu_1_per_cm) * 10,
    tenthValueLayer_mm: (Math.log(10) / mu_1_per_cm) * 10,
    source: XCOM_SOURCE_TRACE,
    warnings,
  };
}

export interface ShieldingMaterial {
  code: string;
  name: string;
  nameEs: string;
  density_g_per_cm3: number;
  effectiveZ: number;
  composition: string;
  ncrpRef: string;
  data: AttenuationEntry[];
}

export interface XcomSourceTrace {
  id: 'NIST-XCOM-SRD8';
  title: string;
  url: string;
  accessed: string;
  scope: string[];
  limitations: string[];
}

export interface XcomMixtureComponent {
  materialCode: string;
  weightFraction: number;
}

export interface XcomMixtureResult {
  energy_MeV: number;
  density_g_per_cm3: number;
  normalizedComponents: Array<XcomMixtureComponent & {
    materialName: string;
    mu_cm2_per_g: number;
  }>;
  mu_cm2_per_g: number;
  mu_1_per_cm: number;
  halfValueLayer_mm: number;
  tenthValueLayer_mm: number;
  source: XcomSourceTrace;
  warnings: string[];
}

export const XCOM_SOURCE_TRACE: XcomSourceTrace = {
  id: 'NIST-XCOM-SRD8',
  title: 'NIST XCOM Photon Cross Sections Database, Standard Reference Database 8',
  url: 'https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html',
  accessed: '2026-07-25',
  scope: [
    'Photon mass attenuation coefficients for elements, compounds and mixtures.',
    'Material mixtures by weight fraction with automatic normalization.',
    'Reference support for diagnostic energy attenuation, material comparison and RAG evidence.',
  ],
  limitations: [
    'Not a standalone NCRP/IAEA shielding methodology.',
    'Megavoltage broad-beam TVL and clinical barrier design still require NCRP/IAEA/UAQ method checks.',
    'Local values must be reviewed against source pages before certified clinical use.',
  ],
};

/** NIST XCOM data for common shielding materials (key energies) */
export const SHIELDING_MATERIALS: ShieldingMaterial[] = [
  {
    code: 'PB',
    name: 'Lead', nameEs: 'Plomo',
    density_g_per_cm3: 11.34,
    effectiveZ: 82,
    composition: 'Pb',
    ncrpRef: 'NCRP 147 Table A.2, NCRP 151 Table B.1',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 168.0, mu_en_cm2_per_g: 158.0, mu_1_per_cm: 1905.1, halfValueLayer_mm: 0.0036, tenthValueLayer_mm: 0.012 },
      { energy_MeV: 0.03, mu_cm2_per_g: 32.2, mu_en_cm2_per_g: 9.56, mu_1_per_cm: 365.1, halfValueLayer_mm: 0.019, tenthValueLayer_mm: 0.063 },
      { energy_MeV: 0.05, mu_cm2_per_g: 9.88, mu_en_cm2_per_g: 1.78, mu_1_per_cm: 112.0, halfValueLayer_mm: 0.062, tenthValueLayer_mm: 0.206 },
      { energy_MeV: 0.08, mu_cm2_per_g: 3.15, mu_en_cm2_per_g: 0.413, mu_1_per_cm: 35.7, halfValueLayer_mm: 0.194, tenthValueLayer_mm: 0.645 },
      { energy_MeV: 0.10, mu_cm2_per_g: 1.88, mu_en_cm2_per_g: 0.235, mu_1_per_cm: 21.3, halfValueLayer_mm: 0.325, tenthValueLayer_mm: 1.08 },
      { energy_MeV: 0.15, mu_cm2_per_g: 0.76, mu_en_cm2_per_g: 0.120, mu_1_per_cm: 8.62, halfValueLayer_mm: 0.804, tenthValueLayer_mm: 2.67 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.45, mu_en_cm2_per_g: 0.087, mu_1_per_cm: 5.10, halfValueLayer_mm: 1.36, tenthValueLayer_mm: 4.52 },
      { energy_MeV: 0.30, mu_cm2_per_g: 0.24, mu_en_cm2_per_g: 0.062, mu_1_per_cm: 2.72, halfValueLayer_mm: 2.55, tenthValueLayer_mm: 8.47 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.156, mu_en_cm2_per_g: 0.042, mu_1_per_cm: 1.77, halfValueLayer_mm: 3.92, tenthValueLayer_mm: 13.0 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.070, mu_en_cm2_per_g: 0.024, mu_1_per_cm: 0.794, halfValueLayer_mm: 8.73, tenthValueLayer_mm: 29.0 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.045, mu_en_cm2_per_g: 0.018, mu_1_per_cm: 0.510, halfValueLayer_mm: 13.6, tenthValueLayer_mm: 45.2 },
      { energy_MeV: 3.00, mu_cm2_per_g: 0.040, mu_en_cm2_per_g: 0.017, mu_1_per_cm: 0.454, halfValueLayer_mm: 15.3, tenthValueLayer_mm: 50.8 },
      { energy_MeV: 4.00, mu_cm2_per_g: 0.038, mu_en_cm2_per_g: 0.017, mu_1_per_cm: 0.431, halfValueLayer_mm: 16.1, tenthValueLayer_mm: 53.5 },
      { energy_MeV: 6.00, mu_cm2_per_g: 0.037, mu_en_cm2_per_g: 0.017, mu_1_per_cm: 0.420, halfValueLayer_mm: 16.5, tenthValueLayer_mm: 54.8 },
      { energy_MeV: 10.0, mu_cm2_per_g: 0.038, mu_en_cm2_per_g: 0.017, mu_1_per_cm: 0.431, halfValueLayer_mm: 16.1, tenthValueLayer_mm: 53.5 },
    ],
  },
  {
    code: 'CONCRETE',
    name: 'Concrete (2.35 g/cm³)', nameEs: 'Concreto (2.35 g/cm³)',
    density_g_per_cm3: 2.35,
    effectiveZ: 14.0,
    composition: 'H(0.556%) O(49.867%) Na(1.699%) Mg(0.246%) Al(3.387%) Si(31.497%) K(1.522%) Ca(8.275%) Fe(0.952%)',
    ncrpRef: 'NCRP 147 Table A.2, NCRP 151 Table B.1',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 26.8, mu_en_cm2_per_g: 24.2, mu_1_per_cm: 62.98, halfValueLayer_mm: 1.10, tenthValueLayer_mm: 3.66 },
      { energy_MeV: 0.03, mu_cm2_per_g: 3.30, mu_en_cm2_per_g: 0.92, mu_1_per_cm: 7.755, halfValueLayer_mm: 8.94, tenthValueLayer_mm: 29.7 },
      { energy_MeV: 0.05, mu_cm2_per_g: 1.10, mu_en_cm2_per_g: 0.19, mu_1_per_cm: 2.585, halfValueLayer_mm: 26.8, tenthValueLayer_mm: 89.0 },
      { energy_MeV: 0.08, mu_cm2_per_g: 0.40, mu_en_cm2_per_g: 0.054, mu_1_per_cm: 0.940, halfValueLayer_mm: 73.7, tenthValueLayer_mm: 245 },
      { energy_MeV: 0.10, mu_cm2_per_g: 0.25, mu_en_cm2_per_g: 0.036, mu_1_per_cm: 0.588, halfValueLayer_mm: 118, tenthValueLayer_mm: 392 },
      { energy_MeV: 0.15, mu_cm2_per_g: 0.12, mu_en_cm2_per_g: 0.023, mu_1_per_cm: 0.282, halfValueLayer_mm: 246, tenthValueLayer_mm: 817 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.085, mu_en_cm2_per_g: 0.019, mu_1_per_cm: 0.200, halfValueLayer_mm: 347, tenthValueLayer_mm: 1152 },
      { energy_MeV: 0.30, mu_cm2_per_g: 0.062, mu_en_cm2_per_g: 0.016, mu_1_per_cm: 0.146, halfValueLayer_mm: 475, tenthValueLayer_mm: 1577 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.045, mu_en_cm2_per_g: 0.013, mu_1_per_cm: 0.106, halfValueLayer_mm: 654, tenthValueLayer_mm: 2172 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.032, mu_en_cm2_per_g: 0.010, mu_1_per_cm: 0.075, halfValueLayer_mm: 924, tenthValueLayer_mm: 3068 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.025, mu_en_cm2_per_g: 0.009, mu_1_per_cm: 0.059, halfValueLayer_mm: 1175, tenthValueLayer_mm: 3900 },
      { energy_MeV: 4.00, mu_cm2_per_g: 0.021, mu_en_cm2_per_g: 0.009, mu_1_per_cm: 0.049, halfValueLayer_mm: 1414, tenthValueLayer_mm: 4693 },
      { energy_MeV: 6.00, mu_cm2_per_g: 0.019, mu_en_cm2_per_g: 0.008, mu_1_per_cm: 0.045, halfValueLayer_mm: 1540, tenthValueLayer_mm: 5111 },
      { energy_MeV: 10.0, mu_cm2_per_g: 0.018, mu_en_cm2_per_g: 0.008, mu_1_per_cm: 0.042, halfValueLayer_mm: 1650, tenthValueLayer_mm: 5476 },
    ],
  },
  {
    code: 'STEEL',
    name: 'Steel (7.87 g/cm³)', nameEs: 'Acero (7.87 g/cm³)',
    density_g_per_cm3: 7.87,
    effectiveZ: 26.0,
    composition: 'Fe(98%) Cr(1%) C(0.5%) Mn(0.5%)',
    ncrpRef: 'NCRP 147 Table A.2',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 170.0, mu_en_cm2_per_g: 158.0, mu_1_per_cm: 1337.9, halfValueLayer_mm: 0.0052, tenthValueLayer_mm: 0.017 },
      { energy_MeV: 0.03, mu_cm2_per_g: 27.5, mu_en_cm2_per_g: 8.12, mu_1_per_cm: 216.4, halfValueLayer_mm: 0.032, tenthValueLayer_mm: 0.107 },
      { energy_MeV: 0.05, mu_cm2_per_g: 9.30, mu_en_cm2_per_g: 1.65, mu_1_per_cm: 73.2, halfValueLayer_mm: 0.095, tenthValueLayer_mm: 0.315 },
      { energy_MeV: 0.08, mu_cm2_per_g: 3.10, mu_en_cm2_per_g: 0.395, mu_1_per_cm: 24.4, halfValueLayer_mm: 0.284, tenthValueLayer_mm: 0.944 },
      { energy_MeV: 0.10, mu_cm2_per_g: 1.85, mu_en_cm2_per_g: 0.230, mu_1_per_cm: 14.6, halfValueLayer_mm: 0.475, tenthValueLayer_mm: 1.58 },
      { energy_MeV: 0.15, mu_cm2_per_g: 0.75, mu_en_cm2_per_g: 0.115, mu_1_per_cm: 5.90, halfValueLayer_mm: 1.17, tenthValueLayer_mm: 3.89 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.44, mu_en_cm2_per_g: 0.084, mu_1_per_cm: 3.46, halfValueLayer_mm: 2.00, tenthValueLayer_mm: 6.64 },
      { energy_MeV: 0.30, mu_cm2_per_g: 0.24, mu_en_cm2_per_g: 0.060, mu_1_per_cm: 1.89, halfValueLayer_mm: 3.67, tenthValueLayer_mm: 12.2 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.154, mu_en_cm2_per_g: 0.041, mu_1_per_cm: 1.21, halfValueLayer_mm: 5.73, tenthValueLayer_mm: 19.0 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.068, mu_en_cm2_per_g: 0.023, mu_1_per_cm: 0.535, halfValueLayer_mm: 12.9, tenthValueLayer_mm: 42.9 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.044, mu_en_cm2_per_g: 0.017, mu_1_per_cm: 0.346, halfValueLayer_mm: 20.0, tenthValueLayer_mm: 66.4 },
      { energy_MeV: 4.00, mu_cm2_per_g: 0.037, mu_en_cm2_per_g: 0.016, mu_1_per_cm: 0.291, halfValueLayer_mm: 23.8, tenthValueLayer_mm: 79.0 },
      { energy_MeV: 6.00, mu_cm2_per_g: 0.036, mu_en_cm2_per_g: 0.016, mu_1_per_cm: 0.283, halfValueLayer_mm: 24.5, tenthValueLayer_mm: 81.3 },
      { energy_MeV: 10.0, mu_cm2_per_g: 0.037, mu_en_cm2_per_g: 0.016, mu_1_per_cm: 0.291, halfValueLayer_mm: 23.8, tenthValueLayer_mm: 79.0 },
    ],
  },
  {
    code: 'GYPSUM',
    name: 'Gypsum Wallboard', nameEs: 'Tablaroca de yeso',
    density_g_per_cm3: 0.70,
    effectiveZ: 13.5,
    composition: 'CaSO4·2H2O',
    ncrpRef: 'NCRP 147 Table A.2',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 28.5, mu_en_cm2_per_g: 26.0, mu_1_per_cm: 19.95, halfValueLayer_mm: 3.47, tenthValueLayer_mm: 11.5 },
      { energy_MeV: 0.03, mu_cm2_per_g: 3.50, mu_en_cm2_per_g: 0.98, mu_1_per_cm: 2.45, halfValueLayer_mm: 28.3, tenthValueLayer_mm: 93.9 },
      { energy_MeV: 0.05, mu_cm2_per_g: 1.15, mu_en_cm2_per_g: 0.20, mu_1_per_cm: 0.805, halfValueLayer_mm: 86.0, tenthValueLayer_mm: 286 },
      { energy_MeV: 0.10, mu_cm2_per_g: 0.27, mu_en_cm2_per_g: 0.038, mu_1_per_cm: 0.189, halfValueLayer_mm: 367, tenthValueLayer_mm: 1218 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.090, mu_en_cm2_per_g: 0.020, mu_1_per_cm: 0.063, halfValueLayer_mm: 1100, tenthValueLayer_mm: 3651 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.047, mu_en_cm2_per_g: 0.014, mu_1_per_cm: 0.033, halfValueLayer_mm: 2100, tenthValueLayer_mm: 6970 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.033, mu_en_cm2_per_g: 0.011, mu_1_per_cm: 0.023, halfValueLayer_mm: 3014, tenthValueLayer_mm: 10006 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.026, mu_en_cm2_per_g: 0.010, mu_1_per_cm: 0.018, halfValueLayer_mm: 3850, tenthValueLayer_mm: 12783 },
    ],
  },
  {
    code: 'POLYETHYLENE',
    name: 'Polyethylene', nameEs: 'Polietileno (blindaje neutrón)',
    density_g_per_cm3: 0.94,
    effectiveZ: 5.4,
    composition: '(C2H4)n',
    ncrpRef: 'NCRP 151 Table B.7 (neutron shielding)',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 5.20, mu_en_cm2_per_g: 4.85, mu_1_per_cm: 4.888, halfValueLayer_mm: 14.2, tenthValueLayer_mm: 47.1 },
      { energy_MeV: 0.03, mu_cm2_per_g: 0.58, mu_en_cm2_per_g: 0.15, mu_1_per_cm: 0.545, halfValueLayer_mm: 127, tenthValueLayer_mm: 422 },
      { energy_MeV: 0.05, mu_cm2_per_g: 0.22, mu_en_cm2_per_g: 0.035, mu_1_per_cm: 0.207, halfValueLayer_mm: 335, tenthValueLayer_mm: 1112 },
      { energy_MeV: 0.10, mu_cm2_per_g: 0.12, mu_en_cm2_per_g: 0.015, mu_1_per_cm: 0.113, halfValueLayer_mm: 614, tenthValueLayer_mm: 2038 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.085, mu_en_cm2_per_g: 0.012, mu_1_per_cm: 0.080, halfValueLayer_mm: 866, tenthValueLayer_mm: 2875 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.062, mu_en_cm2_per_g: 0.010, mu_1_per_cm: 0.058, halfValueLayer_mm: 1195, tenthValueLayer_mm: 3966 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.047, mu_en_cm2_per_g: 0.009, mu_1_per_cm: 0.044, halfValueLayer_mm: 1575, tenthValueLayer_mm: 5228 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.035, mu_en_cm2_per_g: 0.008, mu_1_per_cm: 0.033, halfValueLayer_mm: 2100, tenthValueLayer_mm: 6970 },
    ],
  },
  {
    code: 'BPE',
    name: 'Borated Polyethylene (5% B)', nameEs: 'Polietileno borado (5% B)',
    density_g_per_cm3: 1.00,
    effectiveZ: 7.5,
    composition: '(C2H4)n + 5% B',
    ncrpRef: 'NCRP 151 Table B.7 (neutron TVL)',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 6.50, mu_en_cm2_per_g: 6.10, mu_1_per_cm: 6.50, halfValueLayer_mm: 10.7, tenthValueLayer_mm: 35.4 },
      { energy_MeV: 0.03, mu_cm2_per_g: 0.75, mu_en_cm2_per_g: 0.20, mu_1_per_cm: 0.75, halfValueLayer_mm: 92.4, tenthValueLayer_mm: 307 },
      { energy_MeV: 0.05, mu_cm2_per_g: 0.28, mu_en_cm2_per_g: 0.045, mu_1_per_cm: 0.28, halfValueLayer_mm: 248, tenthValueLayer_mm: 823 },
      { energy_MeV: 0.10, mu_cm2_per_g: 0.14, mu_en_cm2_per_g: 0.019, mu_1_per_cm: 0.14, halfValueLayer_mm: 495, tenthValueLayer_mm: 1643 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.095, mu_en_cm2_per_g: 0.013, mu_1_per_cm: 0.095, halfValueLayer_mm: 730, tenthValueLayer_mm: 2423 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.068, mu_en_cm2_per_g: 0.011, mu_1_per_cm: 0.068, halfValueLayer_mm: 1020, tenthValueLayer_mm: 3385 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.052, mu_en_cm2_per_g: 0.009, mu_1_per_cm: 0.052, halfValueLayer_mm: 1333, tenthValueLayer_mm: 4423 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.040, mu_en_cm2_per_g: 0.008, mu_1_per_cm: 0.040, halfValueLayer_mm: 1733, tenthValueLayer_mm: 5751 },
    ],
  },
  {
    code: 'TUNGSTEN',
    name: 'Tungsten Alloy', nameEs: 'Aleacion de Tungsteno',
    density_g_per_cm3: 17.0,
    effectiveZ: 74.0,
    composition: 'W-Ni-Fe (95/3.5/1.5)',
    ncrpRef: 'NCRP 151 Table B.1 (high density MV)',
    data: [
      { energy_MeV: 0.01, mu_cm2_per_g: 95.0, mu_en_cm2_per_g: 88.0, mu_1_per_cm: 1615, halfValueLayer_mm: 0.0043, tenthValueLayer_mm: 0.014 },
      { energy_MeV: 0.03, mu_cm2_per_g: 15.5, mu_en_cm2_per_g: 4.60, mu_1_per_cm: 263.5, halfValueLayer_mm: 0.026, tenthValueLayer_mm: 0.087 },
      { energy_MeV: 0.05, mu_cm2_per_g: 4.85, mu_en_cm2_per_g: 0.88, mu_1_per_cm: 82.45, halfValueLayer_mm: 0.084, tenthValueLayer_mm: 0.279 },
      { energy_MeV: 0.10, mu_cm2_per_g: 1.10, mu_en_cm2_per_g: 0.140, mu_1_per_cm: 18.70, halfValueLayer_mm: 0.370, tenthValueLayer_mm: 1.23 },
      { energy_MeV: 0.20, mu_cm2_per_g: 0.38, mu_en_cm2_per_g: 0.074, mu_1_per_cm: 6.46, halfValueLayer_mm: 1.07, tenthValueLayer_mm: 3.56 },
      { energy_MeV: 0.50, mu_cm2_per_g: 0.18, mu_en_cm2_per_g: 0.048, mu_1_per_cm: 3.06, halfValueLayer_mm: 2.26, tenthValueLayer_mm: 7.52 },
      { energy_MeV: 1.00, mu_cm2_per_g: 0.092, mu_en_cm2_per_g: 0.031, mu_1_per_cm: 1.56, halfValueLayer_mm: 4.43, tenthValueLayer_mm: 14.7 },
      { energy_MeV: 2.00, mu_cm2_per_g: 0.060, mu_en_cm2_per_g: 0.024, mu_1_per_cm: 1.02, halfValueLayer_mm: 6.79, tenthValueLayer_mm: 22.5 },
      { energy_MeV: 6.00, mu_cm2_per_g: 0.046, mu_en_cm2_per_g: 0.020, mu_1_per_cm: 0.782, halfValueLayer_mm: 8.86, tenthValueLayer_mm: 29.4 },
      { energy_MeV: 10.0, mu_cm2_per_g: 0.047, mu_en_cm2_per_g: 0.020, mu_1_per_cm: 0.799, halfValueLayer_mm: 8.67, tenthValueLayer_mm: 28.8 },
    ],
  },
];

/** Find material by code */
export function findMaterial(code: string): ShieldingMaterial | undefined {
  return SHIELDING_MATERIALS.find(m => m.code === code);
}

/** Get all material codes and names for dropdown */
export function getMaterialOptions(): { code: string; name: string }[] {
  return SHIELDING_MATERIALS.map(m => ({ code: m.code, name: m.nameEs }));
}

/** Interpolate attenuation at a given energy */
export function interpolateAttenuation(
  materialCode: string,
  energy_MeV: number
): AttenuationEntry | null {
  const mat = findMaterial(materialCode);
  if (!mat) return null;
  const data = mat.data;
  // Find bracketing energies
  let lower = data[0], upper = data[data.length - 1];
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].energy_MeV <= energy_MeV && data[i + 1].energy_MeV >= energy_MeV) {
      lower = data[i]; upper = data[i + 1]; break;
    }
  }
  // Logarithmic interpolation for attenuation coefficients
  const t = Math.log(energy_MeV / lower.energy_MeV) / Math.log(upper.energy_MeV / lower.energy_MeV);
  const lerp = (a: number, b: number) => a * Math.exp(t * Math.log(b / a));
  return {
    energy_MeV,
    mu_cm2_per_g: lerp(lower.mu_cm2_per_g, upper.mu_cm2_per_g),
    mu_en_cm2_per_g: lerp(lower.mu_en_cm2_per_g, upper.mu_en_cm2_per_g),
    mu_1_per_cm: lerp(lower.mu_1_per_cm, upper.mu_1_per_cm),
    halfValueLayer_mm: lerp(lower.halfValueLayer_mm, upper.halfValueLayer_mm),
    tenthValueLayer_mm: lerp(lower.tenthValueLayer_mm, upper.tenthValueLayer_mm),
  } as AttenuationEntry;
}

/** Calculate required thickness for target transmission */
export function calculateRequiredThickness(
  materialCode: string,
  energy_MeV: number,
  targetTransmission: number // B value (e.g., 0.001 for 0.1%)
): number | null {
  const entry = interpolateAttenuation(materialCode, energy_MeV);
  if (!entry) return null;
  // t = -ln(B) / μ  where μ is in 1/cm, result in cm, convert to mm
  return (-Math.log(targetTransmission) / entry.mu_1_per_cm) * 10;
}

/** Calculate transmission for a given thickness */
export function calculateTransmission(
  materialCode: string,
  energy_MeV: number,
  thickness_mm: number
): number | null {
  const entry = interpolateAttenuation(materialCode, energy_MeV);
  if (!entry) return null;
  // B = exp(-μ * t) where t is in cm
  return Math.exp(-entry.mu_1_per_cm * (thickness_mm / 10));
}
