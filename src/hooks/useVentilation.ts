// Batch 4: Ventilation calculator for radio pharmacy / cyclotron (NOM + DOE)
export interface VentilationConfig {
  roomVolume_m3: number;               // Volume of the room
  activity_MBq: number;                // Maximum activity handled
  radionuclide: string;                // e.g., 'F-18', 'Tc-99m', 'I-131'
  airChangesPerHour: number;           // Target air changes (NOM-003-NUCL: 6-10 for radiofarmacia)
  ductLength_m: number;                // Length of exhaust duct
  filterEfficiency: number;            // HEPA filter efficiency (0.9997 for HEPA)
}

export interface VentilationResult {
  requiredFlowRate_m3_h: number;
  currentFlowRate_m3_h: number;
  compliant: boolean;
  concentration_Bq_m3: number;         // Activity concentration in exhaust
  doseRateAtExhaust_uSv_h: number;
  filterRequired: boolean;
  charcoalFilterRequired: boolean;     // For iodine
  recommendation: string;
}

// DAC values (Derived Air Concentration) in Bq/m3 from NOM-008-NUCL
const DAC_VALUES: Record<string, number> = {
  'F-18': 7.4e7,    // Bq/m3
  'Tc-99m': 1.1e9,
  'I-131': 1.1e6,
  'Ga-68': 7.4e7,
  'Lu-177': 3.7e7,
  'Y-90': 7.4e6,
  'C-11': 7.4e7,
  'N-13': 7.4e7,
};

export function calculateVentilation(config: VentilationConfig): VentilationResult {
  const dac = DAC_VALUES[config.radionuclide] || 1e8;
  const requiredACH = config.radionuclide === 'I-131' ? 10 : 6; // Higher for iodine
  const requiredFlow = config.roomVolume_m3 * requiredACH;
  const currentFlow = config.roomVolume_m3 * config.airChangesPerHour;

  // Concentration in exhaust (simplified)
  const releaseRate_Bq_s = config.activity_MBq * 1e6 / 3600; // Assume 1 hour operation
  const concentration = releaseRate_Bq_s / (currentFlow / 3600); // Bq/m3

  // Dose rate at exhaust point (simplified point source)
  const gammaConstant = 0.1; // uSv/h per MBq at 1m (varies by nuclide)
  const doseRate = (config.activity_MBq * gammaConstant) / (config.ductLength_m ** 2);

  const compliant = currentFlow >= requiredFlow && concentration < dac;

  const needsCharcoal = ['I-131', 'I-125'].includes(config.radionuclide);

  let rec = '';
  if (!compliant) {
    rec = `Aumentar ventilacion a ${requiredACH} cambios/hora (flujo ${requiredFlow.toFixed(1)} m³/h). `;
    if (needsCharcoal) rec += 'Filtro de carbon activado obligatorio para yodo. ';
    rec += `Concentracion actual: ${concentration.toExponential(2)} Bq/m³ vs DAC: ${dac.toExponential(2)} Bq/m³.`;
  } else {
    rec = 'Sistema de ventilacion cumple con NOM-003-NUCL y NOM-008-NUCL. Mantener filtros HEPA.';
    if (needsCharcoal) rec += ' Incluir filtro de carbon activado para yodo.';
  }

  return {
    requiredFlowRate_m3_h: requiredFlow,
    currentFlowRate_m3_h: currentFlow,
    compliant,
    concentration_Bq_m3: concentration,
    doseRateAtExhaust_uSv_h: doseRate,
    filterRequired: true,
    charcoalFilterRequired: needsCharcoal,
    recommendation: rec,
  };
}
