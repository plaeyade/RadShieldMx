/**
 * B.11: NCRP-151 vs NCRP-147 Cross-Validation
 * Warns when energy/modality doesn't match selected standard
 */

export interface NCRPValidationResult {
  standard: 'NCRP-151' | 'NCRP-147';
  modality: string;
  energy_MeV: number;
  isValid: boolean;
  warning?: string;
  recommendation?: string;
}

// NCRP-151: Megavoltage X-ray and Gamma-Ray (>= 1 MV)
// NCRP-147: Medical X-Ray Imaging (diagnostic, <= 0.5 MV typically)
const NCRP151_MODALITIES = [
  'LINAC', 'Linear Accelerator', 'CyberKnife', 'TomoTherapy',
  'Gamma Knife', 'Co-60', 'Cobalt-60', 'Proton', 'Carbon Ion',
  'Betatron', 'Orthovoltage', 'Superficial',
];

const NCRP147_MODALITIES = [
  'RX', 'Radiography', 'Fluoroscopy', 'CT', 'Computed Tomography',
  'Mammography', 'Dental', 'C-Arm', 'Angiography',
  'CBCT', 'Cone Beam CT', 'DEXA', 'Bone Densitometry',
];

const AMBIGUOUS_MODALITIES = [
  'PET', 'PET/CT', 'SPECT', 'Nuclear Medicine',
  'Cyclotron', 'I-131', 'I-123', 'Tc-99m', 'F-18',
];

export function validateNCRPStandard(
  modality: string,
  energy_MeV: number,
  selectedStandard: 'NCRP-151' | 'NCRP-147'
): NCRPValidationResult {
  const modUpper = modality.toUpperCase();
  const is151Mod = NCRP151_MODALITIES.some(m => modUpper.includes(m.toUpperCase()));
  const is147Mod = NCRP147_MODALITIES.some(m => modUpper.includes(m.toUpperCase()));
  const isAmbiguous = AMBIGUOUS_MODALITIES.some(m => modUpper.includes(m.toUpperCase()));

  // Energy-based validation
  const isHighEnergy = energy_MeV >= 1.0;
  const isLowEnergy = energy_MeV <= 0.5;

  if (isAmbiguous) {
    return {
      standard: selectedStandard,
      modality,
      energy_MeV,
      isValid: true,
      warning: `${modality} es una modalidad híbrida. Considere usar NCRP-151 para terapia y NCRP-147 para imagenología.`,
      recommendation: 'Revise la sección aplicable según el contexto de uso (terapia vs diagnóstico).',
    };
  }

  if (selectedStandard === 'NCRP-151') {
    if (is147Mod && isLowEnergy) {
      return {
        standard: selectedStandard,
        modality,
        energy_MeV,
        isValid: false,
        warning: `ALERTA: ${modality} (${energy_MeV} MV) es típicamente NCRP-147 (imagenología), no NCRP-151.`,
        recommendation: 'Cambie a NCRP-147 para instalaciones de imagenología médica.',
      };
    }
    if (!is151Mod && !is147Mod && energy_MeV < 1.0) {
      return {
        standard: selectedStandard, modality, energy_MeV, isValid: true,
        warning: `Precaución: energía ${energy_MeV} MV es baja para NCRP-151. Verifique que sea terapia megavoltaje.`,
        recommendation: 'Si es diagnóstico, use NCRP-147.',
      };
    }
  }

  if (selectedStandard === 'NCRP-147') {
    if (is151Mod && isHighEnergy) {
      return {
        standard: selectedStandard,
        modality,
        energy_MeV,
        isValid: false,
        warning: `CRÍTICO: ${modality} (${energy_MeV} MV) es terapia megavoltaje — debe usar NCRP-151, no NCRP-147.`,
        recommendation: 'Cambie inmediatamente a NCRP-151 para terapia megavoltaje.',
      };
    }
    if (energy_MeV > 0.5) {
      return {
        standard: selectedStandard, modality, energy_MeV, isValid: true,
        warning: `Precaución: ${energy_MeV} MV excede el rango típico de NCRP-147 (≤ 0.5 MV para diagnóstico).`,
        recommendation: 'Para CT de alta energía, verifique tablas específicas del fabricante.',
      };
    }
  }

  return { standard: selectedStandard, modality, energy_MeV, isValid: true };
}

export function getRecommendedStandard(modality: string, energy_MeV: number): 'NCRP-151' | 'NCRP-147' | 'AMBIGUOUS' {
  const modUpper = modality.toUpperCase();
  if (NCRP151_MODALITIES.some(m => modUpper.includes(m.toUpperCase()))) return 'NCRP-151';
  if (NCRP147_MODALITIES.some(m => modUpper.includes(m.toUpperCase()))) return 'NCRP-147';
  if (AMBIGUOUS_MODALITIES.some(m => modUpper.includes(m.toUpperCase()))) return 'AMBIGUOUS';
  return energy_MeV >= 1.0 ? 'NCRP-151' : 'NCRP-147';
}
