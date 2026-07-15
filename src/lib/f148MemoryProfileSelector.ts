import { buildF144SourceGovernance, type F144MemoryProfile } from '@/lib/f144SourceGovernance';
import type { F113ModalityProfileId } from '@/lib/f113ModalityProfiles';

export type F148MemoryProfileKey = 'DIAGNOSTIC' | 'LINAC' | 'GAMMA_KNIFE' | 'BRAQUI_CO60' | 'NUCLEAR_MEDICINE' | 'CYCLOTRON';

export interface F148MemoryProfileOption {
  key: F148MemoryProfileKey;
  label: string;
  description: string;
  profile: F144MemoryProfile;
  requiredInputs: string[];
  exportWarnings: string[];
}

export interface F148MemoryProfileSelectorSummary {
  phase: 'F148';
  status: 'implemented-memory-profile-selector';
  options: F148MemoryProfileOption[];
  defaultKey: F148MemoryProfileKey;
  selectionPolicy: string[];
  decision: string;
}

const labels: Record<F148MemoryProfileKey, { label: string; description: string; requiredInputs: string[]; warnings: string[] }> = {
  DIAGNOSTIC: {
    label: 'DX / Diagnostico',
    description: 'Memoria para imagen diagnostica con NCRP 147/IPEM 109, workload, ocupacion, barreras y control booth.',
    requiredInputs: ['modalidad RX/CT/fluoro', 'workload/protocolos', 'ocupacion T', 'distancias', 'control booth y zonas adyacentes'],
    warnings: ['No aplicar por defecto NCRP 151 de terapia.', 'PET/CT con radionuclidos debe revisar si corresponde perfil NM.'],
  },
  LINAC: {
    label: 'LINAC / AL',
    description: 'Memoria para acelerador lineal con barreras primarias/secundarias, carga W/U/T/P y evidencia NCRP 151.',
    requiredInputs: ['energia MV', 'workload W', 'use factor U', 'occupancy T', 'design goal P', 'distancias y barreras del floorplan'],
    warnings: ['No reutilizar espesores de memorias previas sin recalculo.', 'Material alternativo requiere anexo TVL/densidad/peso/incertidumbre.'],
  },
  GAMMA_KNIFE: {
    label: 'Gamma Knife',
    description: 'Memoria para radiosurgery Co-60 con guia de fabricante separada de calculo normativo.',
    requiredInputs: ['modelo/version', 'actividad/fuentes Co-60', 'fecha de referencia', 'footprint', 'barreras/puerta/zonas'],
    warnings: ['Guia Elekta es planeacion, no limite regulatorio.', 'Confirmar actividad y modelo antes de emitir calculo final.'],
  },
  BRAQUI_CO60: {
    label: 'Braqui Co-60',
    description: 'Memoria ejemplo para braquiterapia Co-60/HDR con fuente, tiempo, distancia y control de area.',
    requiredInputs: ['actividad', 'tiempo de tratamiento', 'distancia', 'control de acceso', 'emergencias'],
    warnings: ['Usar ejemplo previo solo como formato.', 'Recalcular con actividad/tiempo reales.'],
  },
  NUCLEAR_MEDICINE: {
    label: 'NM / Med. Nuclear',
    description: 'Memoria para PET/SPECT/radiofarmacia con TG-108, actividad, tiempos, rutas de pacientes y zonas controladas.',
    requiredInputs: ['radionuclido', 'actividad administrada', 'tiempos uptake/scan', 'hot lab/residuos', 'pacientes por semana', 'ocupacion'],
    warnings: ['Separar blindaje externo de dosimetria interna.', 'Citar TG-108/NCRP/ICRP antes de emitir resultados finales.'],
  },
  CYCLOTRON: {
    label: 'Ciclotron',
    description: 'Memoria para acelerador de particulas con neutron/activacion y ruta NCRP 144.',
    requiredInputs: ['energia protones', 'corriente', 'target', 'workload', 'laberinto/puerta', 'activacion'],
    warnings: ['No tratar como LINAC convencional.', 'Requiere QA neutron/activacion antes de release.'],
  },
};

export const f148ProfileByF117Profile: Record<F113ModalityProfileId, F148MemoryProfileKey> = {
  dx: 'DIAGNOSTIC',
  tx: 'LINAC',
  nm: 'NUCLEAR_MEDICINE',
  cy: 'CYCLOTRON',
};

export function getF148ProfileForF117(profileId: F113ModalityProfileId): F148MemoryProfileKey {
  return f148ProfileByF117Profile[profileId] ?? 'DIAGNOSTIC';
}

export function buildF148MemoryProfileSelector(): F148MemoryProfileSelectorSummary {
  const governance = buildF144SourceGovernance();
  const options = governance.memoryProfiles.map((profile) => {
    const key = profile.modality as F148MemoryProfileKey;
    const meta = labels[key];
    return {
      key,
      label: meta.label,
      description: meta.description,
      profile,
      requiredInputs: meta.requiredInputs,
      exportWarnings: meta.warnings,
    };
  });

  return {
    phase: 'F148',
    status: 'implemented-memory-profile-selector',
    options,
    defaultKey: 'DIAGNOSTIC',
    selectionPolicy: [
      'Active DX/TX/NM/CY profile can preselect a memory profile, but user confirmation remains explicit.',
      'Profile selection changes memory structure and source routing, not calculation constants by itself.',
      'Normative sources remain controlled by F144 hierarchy.',
      'Export should preserve selected profile, required inputs and warnings.',
      'Prior memories are examples only until recalculated with the active floorplan.',
    ],
    decision:
      'F148 adds explicit modality profile selection to Memoria IA so DX, TX, NM and CY reports follow different evidence and methodology routes.',
  };
}

export function getF148MemoryProfile(key: F148MemoryProfileKey): F148MemoryProfileOption {
  const selector = buildF148MemoryProfileSelector();
  return selector.options.find((option) => option.key === key) ?? selector.options[0];
}
