export type F113ModalityProfileId = 'dx' | 'tx' | 'nm' | 'cy';

export interface F113ModalityProfile {
  id: F113ModalityProfileId;
  label: string;
  name: string;
  category: 'diagnostic' | 'therapy' | 'nuclear' | 'cyclotron';
  standards: string[];
  equipment: string[];
  calculations: string[];
  memoriaSteps: string[];
  canvasHints: string[];
}

export const F113_MODALITY_PROFILES: F113ModalityProfile[] = [
  {
    id: 'dx',
    label: 'DX',
    name: 'Diagnostico',
    category: 'diagnostic',
    standards: ['NCRP 147', 'IPEM 109', 'NOM-008-NUCL'],
    equipment: ['RX', 'CT', 'Fluoroscopia', 'Mamografia'],
    calculations: ['Primaria', 'Dispersa', 'Fuga', 'Piso/techo'],
    memoriaSteps: ['layout', 'equipo', 'workload', 'barreras', 'citas NCRP 147'],
    canvasHints: ['zona controlada', 'puntos de ocupacion', 'cotas de sala', 'scatter points'],
  },
  {
    id: 'tx',
    label: 'TX',
    name: 'Terapia',
    category: 'therapy',
    standards: ['NCRP 151', 'IAEA SRS-47', 'CNSNS LA-007/01'],
    equipment: ['LINAC', 'Gamma Knife', 'HDR', 'Co-60'],
    calculations: ['Primaria', 'Secundaria', 'Neutrones', 'Laberinto', 'Skyshine'],
    memoriaSteps: ['bunker', 'isocentro', 'energia', 'maze', 'neutrones', 'reporte CNSNS'],
    canvasHints: ['isocentro', 'muro primario', 'muro secundario', 'laberinto', 'puerta'],
  },
  {
    id: 'nm',
    label: 'NM',
    name: 'Medicina nuclear',
    category: 'nuclear',
    standards: ['AAPM TG-108', 'NCRP 147/155', 'ICRP 128'],
    equipment: ['PET/CT', 'SPECT/CT', 'Radiofarmacia', 'Terapia radionuclidos'],
    calculations: ['511 keV', 'almacenamiento', 'pacientes', 'residuos', 'dosimetria interna'],
    memoriaSteps: ['actividad', 'radionuclido', 'tiempos', 'ocupacion', 'RAG evidencia'],
    canvasHints: ['hot lab', 'uptake rooms', 'sala PET', 'residuos', 'zonas calientes'],
  },
  {
    id: 'cy',
    label: 'CY',
    name: 'Ciclotron',
    category: 'cyclotron',
    standards: ['IAEA SRS-47', 'NCRP 151', 'NOM-008-NUCL'],
    equipment: ['Cyclone/KIUBE', 'target cave', 'hot cells', 'radiofarmacia'],
    calculations: ['neutrones', 'activacion', 'skyshine', 'ventilacion', 'Monte Carlo'],
    memoriaSteps: ['energia protones', 'target', 'produccion', 'activacion', 'blindaje masivo'],
    canvasHints: ['target cave', 'muro pesado', 'ductos', 'maze', 'zonas de produccion'],
  },
];

export interface F113ModalityProfileImplementation {
  phase: 'F113';
  status: 'implemented-additive';
  defaultProfile: F113ModalityProfileId;
  storageKey: string;
  activeProfiles: string[];
  preservedSurfaces: string[];
  nextPhase: string;
  decision: string;
}

export function buildF113ModalityProfileImplementation(): F113ModalityProfileImplementation {
  return {
    phase: 'F113',
    status: 'implemented-additive',
    defaultProfile: 'dx',
    storageKey: 'radshield:f113:active-modality-profile',
    activeProfiles: F113_MODALITY_PROFILES.map((profile) => `${profile.label} ${profile.name}`),
    preservedSurfaces: [
      'F92 canonical workflow dropdowns',
      'F112 persistent favorites',
      'F112 smart chips',
      'legacy fallback menus',
      'existing CategoryToolsDialog handler',
    ],
    nextPhase: 'F114 should deduplicate the top bar after profile smoke validates every migrated destination.',
    decision: 'F113 converts DX/TX/NM/CY into persistent active modality profiles while preserving existing category launch behavior and all legacy fallbacks.',
  };
}
