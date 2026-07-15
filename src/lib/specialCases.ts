// =============================================================================
// specialCases.ts — Casos especiales de blindaje (v14.4)
// AREA_ESPERA, MORGUE_RADIOACTIVO, OFTALMOLOGIA_INTERV, ARP,
// DOSIS_TRABAJADOR_IMPLANTES, Cuarto Terapia Radionúclidos, ANEXOS_TECNICOS
// =============================================================================

// ── 1. ÁREA DE ESPERA PACIENTES I-131 ──
export interface AreaEsperaData {
  radionuclide: string; activity_mbq: number; half_life_h: number;
  gamma_energy_keV: number; gamma_constant: number;
  recommended_shielding_cm: number; material: string;
  distance_to_public_m: number; max_dose_public_mSv_year: number;
}
export const AREA_ESPERA: AreaEsperaData = {
  radionuclide: 'I-131 (terapia tiroidea)', activity_mbq: 3700, half_life_h: 192,
  gamma_energy_keV: 364, gamma_constant: 0.059, // μSv·m²/(h·MBq)
  recommended_shielding_cm: 5, material: 'Plomo laminado 2mm + concreto 5cm',
  distance_to_public_m: 3.0, max_dose_public_mSv_year: 5,
};

// ── 2. MORGUE RADIOACTIVO (pacientes fallecidos con I-131) ──
export interface MorgueRadioactivoData {
  radionuclide: string; typical_residual_mbq: number; time_since_admin_h: number;
  shielding_required: boolean; recommended_material: string;
  handling_protocol: string[]; regulations: string[];
}
export const MORGUE_RADIOACTIVO: MorgueRadioactivoData = {
  radionuclide: 'I-131 residual post-mortem', typical_residual_mbq: 1850,
  time_since_admin_h: 72, shielding_required: true,
  recommended_material: 'Concreto 10cm o plomo 2mm en paredes contenedora',
  handling_protocol: [
    'Notificar comisión hospitalaria de RP inmediatamente',
    'Aislamiento del cuerpo en bolsa plomada o contenedor con blindaje',
    'Señalización de área con símbolo de radiación',
    'Personal con dosimetría personal obligatoria',
    'Minimizar tiempo de exposición del personal (ALARA)',
    'Registro de actividad residual y tiempo de decaimiento',
    'Contactar servicio de medicina nuclear para medición',
    'NOM-041-NUCL-2013: Procedimientos post-mortem',
  ],
  regulations: ['NOM-041-NUCL-2013 §5.2', 'NCRP 155 §4.3', 'IAEA SSG-46'],
};

// ── 3. OFTALMOLOGÍA INTERVENCIONISTA (I-125 / Ru-106 / Y-90) ──
export interface OftalmoIntervData {
  procedures: Array<{
    name: string; radionuclide: string; activity_mbq: number;
    gamma_energy_keV: number; half_life_d: number;
    shielding_type: string; HVL_mm_pb: number; notes: string;
  }>;
  general_requirements: string[];
}
export const OFTALMOLOGIA_INTERV: OftalmoIntervData = {
  procedures: [
    { name: 'Placa rutisiana (Ru-106)', radionuclide: 'Ru-106/Rh-106', activity_mbq: 37, gamma_energy_keV: 512, half_life_d: 373.6, shielding_type: 'Plomo 0.5mm + guante plomado', HVL_mm_pb: 0.4, notes: 'Betaterapia epiescleral, dosis 400 Gy a 1mm' },
    { name: 'Placa I-125 (melanoma coroideo)', radionuclide: 'I-125', activity_mbq: 11.1, gamma_energy_keV: 27, half_life_d: 59.4, shielding_type: 'Plomo 0.1mm + guante plomado', HVL_mm_pb: 0.02, notes: 'Braquiterapia oftálmica, 85 Gy a punta tumor' },
    { name: 'Y-90 microesferas (SIRT hepático)', radionuclide: 'Y-90', activity_mbq: 1850, gamma_energy_keV: 0, half_life_d: 2.67, shielding_type: 'Bremmstrahlung: plomo 1mm', HVL_mm_pb: 1.0, notes: 'Emisión beta, Bremsstrahlung como radiación secundaria' },
  ],
  general_requirements: [
    'Sala de procedimiento con blindaje mínimo (bajas energías)',
    'Ventana plomada para observación (LX-57B o equivalente)',
    'Dosimetría personal para cirujano y asistentes',
    'Monitor de área con alarma en sala',
    'Protocolo de desecho de placas usadas (residuo radioactivo)',
    'NOM-008-NUCL-2018: Límites dosis personal',
  ],
};

// ── 4. ANÁLISIS DE RIESGO PROBABILÍSTICO (ARP) ──
export interface ARPEntry {
  scenario: string; probability: string; consequence: string;
  risk_level: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'; mitigation: string;
}
export const ARP_SCENARIOS: ARPEntry[] = [
  { scenario: 'Fallo estructural pared primaria (grieta)', probability: 'Muy baja', consequence: 'Aumento dosis área adyacente 10-100x', risk_level: 'Alto', mitigation: 'Inspección anual estructural, pruebas integridad cada 5 años' },
  { scenario: 'Deterioro blindaje por humedad/corrosión', probability: 'Baja', consequence: 'Reducción densidad concreto 10-30%', risk_level: 'Medio', mitigation: 'Control humedad < 70%, recubrimiento impermeable' },
  { scenario: 'Modificación no autorizada de instalación', probability: 'Media', consequence: 'Nuevas rutas de fuga no evaluadas', risk_level: 'Alto', mitigation: 'Procedimiento cambios autorizado por físico médico' },
  { scenario: 'Aumento carga trabajo no evaluado', probability: 'Media', consequence: 'Exceso dosis acumulada áreas públicas', risk_level: 'Alto', mitigation: 'Reevaluación blindaje si W aumenta > 20%' },
  { scenario: 'Terremoto > 7.0 Richter', probability: 'Baja (zona sísmica)', consequence: 'Colapso estructural + pérdida blindaje', risk_level: 'Crítico', mitigation: 'Diseño sísmico NTC, revisión post-sismo' },
  { scenario: 'Incendio en sala tratamiento', probability: 'Baja', consequence: 'Degradación concreto por calor > 300°C', risk_level: 'Medio', mitigation: 'Sistema supresión, materiales ignífugos' },
  { scenario: 'Neutrones > 10 MV sin blindaje específico', probability: 'Baja', consequence: 'Dosis equivalente no evaluada', risk_level: 'Alto', mitigation: 'BPE en puerta, evaluación Kersey obligatoria' },
  { scenario: 'Desgaste puerta laberinto (cierre hermético)', probability: 'Media', consequence: 'Fuga directa a área control', risk_level: 'Medio', mitigation: 'Mantenimiento semestral, pruebas hermeticidad' },
];

// ── 5. DOSIS A TRABAJADORES EN IMPLANTES PERMANENTES ──
export interface DosisTrabajadorImplantes {
  procedure: string; radionuclide: string;
  dose_to_surgeon_uSv_per_procedure: number;
  dose_to_assistant_uSv_per_procedure: number;
  dose_to_nurse_uSv_per_procedure: number;
  annual_limit_procedures: number; // para mantenerse bajo 20 mSv/año
  protective_measures: string[];
}
export const DOSIS_TRABAJADOR_IMPLANTES: DosisTrabajadorImplantes[] = [
  { procedure: 'Próstata (I-125)', radionuclide: 'I-125 (27 keV)', dose_to_surgeon_uSv_per_procedure: 15, dose_to_assistant_uSv_per_procedure: 5, dose_to_nurse_uSv_per_procedure: 3, annual_limit_procedures: 1300, protective_measures: ['Mesa plomada bajo paciente', 'Guantes plomados (0.5mm)', 'Gafas plomadas', 'Minimizar tiempo manejo semillas'] },
  { procedure: 'Próstata (Pd-103)', radionuclide: 'Pd-103 (21 keV)', dose_to_surgeon_uSv_per_procedure: 8, dose_to_assistant_uSv_per_procedure: 3, dose_to_nurse_uSv_per_procedure: 2, annual_limit_procedures: 2500, protective_measures: ['Mesa plomada bajo paciente', 'Guantes plomados (0.25mm)', 'Pinzas largas', 'Contador Geiger disponible'] },
  { procedure: 'Mama (I-125)', radionuclide: 'I-125 (27 keV)', dose_to_surgeon_uSv_per_procedure: 20, dose_to_assistant_uSv_per_procedure: 8, dose_to_nurse_uSv_per_procedure: 5, annual_limit_procedures: 1000, protective_measures: ['Escudo portátil plomado', 'Guantes plomados', 'Monitor de área', 'ALARA: minimizar tiempo'] },
  { procedure: 'Ocular (Ru-106)', radionuclide: 'Ru-106 (3.5 MeV β)', dose_to_surgeon_uSv_per_procedure: 50, dose_to_assistant_uSv_per_procedure: 15, dose_to_nurse_uSv_per_procedure: 5, annual_limit_procedures: 400, protective_measures: ['Guantes plomados (0.5mm Pb)', 'Pinzas de tungsteno', 'Escudo facial plomado', 'Protección ocular cirujano'] },
];

// ── 6. CUARTO DE TERAPIA CON RADIONÚCLIDOS (I-131 oral) ──
export interface CuartoTerapiaRadionuclidos {
  procedure: string; activity_range_mbq: [number, number];
  room_requirements: string[]; shielding_requirements: string[];
  patient_release_criteria: string[]; monitoring_requirements: string[];
}
export const CUARTO_TERAPIA_RADIONUCLIDOS: CuartoTerapiaRadionuclidos = {
  procedure: 'Terapia con I-131 (cáncer tiroides / hipertiroidismo)',
  activity_range_mbq: [1110, 7400], // 30-200 mCi
  room_requirements: [
    'Sala individual con baño privado (paciente aislado)',
    'Superficies lisas, no porosas, fáciles de descontaminar',
    'Baño con sistema desagüe independiente o retención temporal',
    'Señalización de precaución por radiación en puerta',
    'Monitor de radiación portátil disponible',
    'Dosimetría personal para enfermería y médico',
  ],
  shielding_requirements: [
    'Paredes: concreto 15-20 cm o plomo 1-2 mm equivalente',
    'Puerta: plomo 2mm laminado',
    'Piso: concreto 10 cm (hermeticidad)',
    'Ventana de observación: vidrio plomado LX-57B (2.4 g/cm³)',
    'Distancia mínima a área pública: 3 m',
  ],
  patient_release_criteria: [
    'NOM-041-NUCL-2013: Actividad residual < 1200 MBq (33 mCi)',
    'Tasa dosis a 1m < 20 μSv/h',
    'Instrucciones escritas al paciente (evitar contacto cercano 2-3 días)',
    'Criterio basado en dosis máxima a personas de contacto: < 5 mSv',
  ],
  monitoring_requirements: [
    'Medición dosis en paredes colindantes: diaria primeras 48h',
    'Dosimetría personal enfermería: por turno',
    'Medición residual paciente antes de alta',
    'Registro de tiempo de permanencia y actividad administrada',
  ],
};

// ── 7. ANEXOS TÉCNICOS ──
export interface AnexoTecnico {
  id: string; title: string; description: string; reference: string;
}
export const ANEXOS_TECNICOS: AnexoTecnico[] = [
  { id: 'A', title: 'Anexo A — Datos de Entrada', description: 'Parámetros completos del equipo, instalación, carga de trabajo, factores de ocupación y uso, distancias, materiales seleccionados.', reference: 'NCRP 151 §4' },
  { id: 'B', title: 'Anexo B — Resultados Detallados', description: 'Cálculos individuales por barrera: transmisión, número de TVL, espesor requerido, verificación TADR.', reference: 'NCRP 151 §4.8-4.13' },
  { id: 'C', title: 'Anexo C — Validación', description: 'Comparación con Monte Carlo si aplica, verificación independiente, criterios de aceptación.', reference: 'AAPM TG 195' },
  { id: 'D', title: 'Anexo D — Planos', description: 'Croquis arquitectónico con puntos de cálculo, rutas de haz primario/secundario, ubicación de fuente.', reference: 'LAYOUT_ESTRUCTURAL' },
  { id: 'E', title: 'Anexo E — Especificaciones de Materiales', description: 'Fichas técnicas de materiales seleccionados: densidad, TVL, resistencia compresiva, certificados.', reference: 'MATERIALES_BLINDAJE' },
  { id: 'F', title: 'Anexo F — Presupuesto', description: 'Estimación de costos: materiales, mano de obra, equipos, contingencia.', reference: 'CAPEX_OPEX' },
  { id: 'G', title: 'Anexo G — Programa de Mantenimiento', description: 'Frecuencia de inspecciones, responsables, criterios de aceptación post-construcción.', reference: 'REGISTRO_MANTENIMIENTO' },
  { id: 'H', title: 'Anexo H — Referencias Normativas', description: 'Listado completo de normas aplicables: NOMs, NCRP, IAEA, AAPM.', reference: '9. Referencias' },
  { id: 'I', title: 'Anexo I — Memoria de Cálculo', description: 'Documento independiente con todos los cálculos paso a paso y referencias ecuaciones.', reference: 'PROTOCOLO_UAQ_TESIS' },
];

// ── Summary function ──
export function getAllSpecialCases() {
  return {
    area_espera: AREA_ESPERA,
    morgue_radioactivo: MORGUE_RADIOACTIVO,
    oftalmologia_interv: OFTALMOLOGIA_INTERV,
    arp_scenarios: ARP_SCENARIOS,
    dosis_trabajador_implantes: DOSIS_TRABAJADOR_IMPLANTES,
    cuarto_terapia_radionuclidos: CUARTO_TERAPIA_RADIONUCLIDOS,
    anexos_tecnicos: ANEXOS_TECNICOS,
  };
}
