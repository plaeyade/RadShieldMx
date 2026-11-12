/**
 * ═══════════════════════════════════════════════════════════
 * NCRP 147 / NCRP 151 — Occupancy Factors (T)
 * Standard occupancy factors for shielding design
 * ═══════════════════════════════════════════════════════════
 */

import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from './limitesDosis';

export interface OccupancyProfile {
  id: string;
  name: string;
  nameEs: string;
  occupancyFactor: number; // T factor
  description: string;
  descriptionEs: string;
  typicalUse: string[];
  ncrpReference: string; // Section reference
}

/** NCRP 147 Table A.1 — Occupancy Factors */
export const NCRP_OCCUPANCY_PROFILES: OccupancyProfile[] = [
  {
    id: 'control_room',
    name: 'Control Room / Treatment Room',
    nameEs: 'Sala de Control / Sala de Tratamiento',
    occupancyFactor: 1.0,
    description: 'Fully occupied areas — staff working full time',
    descriptionEs: 'Areas totalmente ocupadas — personal trabajando tiempo completo',
    typicalUse: ['LINAC control room', 'CT control room', 'Fluoro control room'],
    ncrpReference: 'NCRP 147 Table A.1, T=1'
  },
  {
    id: 'office',
    name: 'Administrative Office / Consultation',
    nameEs: 'Oficina Administrativa / Consultorio',
    occupancyFactor: 1.0,
    description: 'Administrative areas — staff working full time',
    descriptionEs: 'Areas administrativas — personal trabajando tiempo completo',
    typicalUse: ['Physicist office', 'Physician office', 'Secretariat'],
    ncrpReference: 'NCRP 147 Table A.1, T=1'
  },
  {
    id: 'patient_room',
    name: 'Patient Room / Ward',
    nameEs: 'Cuarto de Paciente / Sala de Hospital',
    occupancyFactor: 1.0,
    description: 'Inpatient areas — occupied by patients full time',
    descriptionEs: 'Areas de internamiento — ocupadas por pacientes tiempo completo',
    typicalUse: ['Inpatient ward', 'Recovery room', 'ICU'],
    ncrpReference: 'NCRP 147 Table A.1, T=1'
  },
  {
    id: 'corridor',
    name: 'Corridor / Hallway',
    nameEs: 'Corredor / Pasillo',
    occupancyFactor: 0.2,
    description: 'Partially occupied — traffic areas',
    descriptionEs: 'Parcialmente ocupado — areas de transito',
    typicalUse: ['Staff corridor', 'Patient corridor', 'Service hallway'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/5'
  },
  {
    id: 'elevator',
    name: 'Elevator / Stairs',
    nameEs: 'Elevador / Escaleras',
    occupancyFactor: 0.05,
    description: 'Occasional use — vertical circulation',
    descriptionEs: 'Uso ocasional — circulacion vertical',
    typicalUse: ['Elevator shaft', 'Stairwell', 'Escalator'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/20'
  },
  {
    id: 'waiting_room',
    name: 'Waiting Room / Lounge',
    nameEs: 'Sala de Espera / Vestibulo',
    occupancyFactor: 0.05,
    description: 'Occasional use — public waiting areas',
    descriptionEs: 'Uso ocasional — areas de espera publica',
    typicalUse: ['Patient waiting', 'Family lounge', 'Reception area'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/20'
  },
  {
    id: 'restroom',
    name: 'Restroom / Locker Room',
    nameEs: 'Bano / Vestidor',
    occupancyFactor: 0.05,
    description: 'Occasional use — brief occupancy',
    descriptionEs: 'Uso ocasional — occupacion breve',
    typicalUse: ['Public restroom', 'Staff locker room', 'Changing room'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/20'
  },
  {
    id: 'parking',
    name: 'Parking Lot / Unattended Outdoor',
    nameEs: 'Estacionamiento / Exterior No Atendido',
    occupancyFactor: 0.025,
    description: 'Rarely occupied — outdoor areas',
    descriptionEs: 'Raramente ocupado — areas exteriores',
    typicalUse: ['Parking', 'Roof access', 'Mechanical yard'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/40'
  },
  {
    id: 'store',
    name: 'Retail Store / Commercial',
    nameEs: 'Tienda / Comercial',
    occupancyFactor: 0.05,
    description: 'Commercial areas — customers and staff',
    descriptionEs: 'Areas comerciales — clientes y personal',
    typicalUse: ['Gift shop', 'Cafeteria', 'Pharmacy'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/20'
  },
  {
    id: 'public_street',
    name: 'Public Street / Sidewalk',
    nameEs: 'Calle Publica / Banqueta',
    occupancyFactor: 0.05,
    description: 'Public thoroughfare — brief exposure',
    descriptionEs: 'Via publica — exposicion breve',
    typicalUse: ['Sidewalk', 'Public road', 'Playground'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/20'
  },
  {
    id: 'darkroom',
    name: 'Darkroom / Film Storage',
    nameEs: 'Cuarto Oscuro / Almacen de Pelicula',
    occupancyFactor: 0.025,
    description: 'Rarely occupied — film storage areas',
    descriptionEs: 'Raramente ocupado — areas de almacenamiento de pelicula',
    typicalUse: ['Film storage', 'Archive room', 'Server room'],
    ncrpReference: 'NCRP 147 Table A.1, T=1/40'
  },
  {
    id: 'attic',
    name: 'Attic / Crawl Space / Unoccupied',
    nameEs: 'Atico / Espacio de Acceso / No Ocupado',
    occupancyFactor: 0.0,
    description: 'Unoccupied — storage only, no person access',
    descriptionEs: 'No ocupado — solo almacenamiento, sin acceso de personas',
    typicalUse: ['Attic', 'Crawl space', 'Mechanical penthouse'],
    ncrpReference: 'NCRP 147 Table A.1, T=0 (uncontrolled)'
  }
];

/** Design goals (P) in mSv/week per NCRP 147 / 151. Derivados de la fuente única `limitesDosis.ts`. */
export const NCRP_DESIGN_GOALS = {
  /** Controlled areas (P_CONTROLADA_mSv_semana) */
  controlled: P_CONTROLADA_mSv_semana,
  /** Uncontrolled areas (P_NO_CONTROLADA_mSv_semana) */
  uncontrolled: P_NO_CONTROLADA_mSv_semana,
  /** Public areas: objetivo de área no controlada */
  public: P_NO_CONTROLADA_mSv_semana,
  /** Staff areas: objetivo de área controlada */
  staff: P_CONTROLADA_mSv_semana,
  /** Shielded console area: objetivo de área no controlada (criterio conservador de la herramienta) */
  console: P_NO_CONTROLADA_mSv_semana,
} as const;

/** Suggest occupancy profile based on region/barrier name keywords */
export function suggestOccupancyProfile(name: string): OccupancyProfile {
  const lower = name.toLowerCase();
  if (lower.includes('control')) return NCRP_OCCUPANCY_PROFILES[0];
  if (lower.includes('oficina') || lower.includes('office')) return NCRP_OCCUPANCY_PROFILES[1];
  if (lower.includes('paciente') || lower.includes('patient')) return NCRP_OCCUPANCY_PROFILES[2];
  if (lower.includes('pasillo') || lower.includes('corridor') || lower.includes('hall')) return NCRP_OCCUPANCY_PROFILES[3];
  if (lower.includes('elevador') || lower.includes('elevator') || lower.includes('escalera')) return NCRP_OCCUPANCY_PROFILES[4];
  if (lower.includes('espera') || lower.includes('waiting') || lower.includes('lobby')) return NCRP_OCCUPANCY_PROFILES[5];
  if (lower.includes('bano') || lower.includes('restroom') || lower.includes('locker')) return NCRP_OCCUPANCY_PROFILES[6];
  if (lower.includes('estacionamiento') || lower.includes('parking')) return NCRP_OCCUPANCY_PROFILES[7];
  if (lower.includes('tienda') || lower.includes('store') || lower.includes('cafeteria')) return NCRP_OCCUPANCY_PROFILES[8];
  if (lower.includes('calle') || lower.includes('street') || lower.includes('exterior')) return NCRP_OCCUPANCY_PROFILES[9];
  // Default: corridor for unknown
  return NCRP_OCCUPANCY_PROFILES[3];
}

/** Get design goal (P) based on area type */
export function getDesignGoal(areaType: 'controlled' | 'uncontrolled' | 'public' | 'staff' | 'console'): number {
  return NCRP_DESIGN_GOALS[areaType];
}

/** Format occupancy factor for display */
export function formatOccupancy(factor: number): string {
  if (factor === 1) return '1 (total)';
  if (factor === 0.2) return '1/5 (parcial)';
  if (factor === 0.05) return '1/20 (ocasional)';
  if (factor === 0.025) return '1/40 (raro)';
  if (factor === 0) return '0 (no ocupado)';
  return factor.toString();
}
