import { F113_MODALITY_PROFILES, type F113ModalityProfile, type F113ModalityProfileId } from './f113ModalityProfiles';
import { NOM_008_NUCL } from './normativaMx';

export const F117_ACTIVE_PROFILE_KEY = 'radshield:f113:active-modality-profile';

export interface F117MemoriaDefaults {
  reportType: string;
  recommendedEquipmentKeys: string[];
  requiredSections: string[];
  methodFocus: string[];
  firstPrompt: string;
}

export interface F117ReportDefaults {
  templateId: string;
  title: string;
  appendixOrder: string[];
  exportTags: string[];
}

export interface F117EvidenceDefaults {
  objective: string;
  priorityDocuments: string[];
  ragQueries: string[];
  citationTags: string[];
}

export interface F117ModalityHandoff {
  phase: 'F117';
  status: 'implemented-additive';
  storageKey: typeof F117_ACTIVE_PROFILE_KEY;
  activeProfile: F113ModalityProfile;
  memoriaDefaults: F117MemoriaDefaults;
  reportDefaults: F117ReportDefaults;
  evidenceDefaults: F117EvidenceDefaults;
  handoffTargets: string[];
  nextPhase: string;
  decision: string;
}

const defaultsByProfile: Record<F113ModalityProfileId, Omit<F117ModalityHandoff, 'phase' | 'status' | 'storageKey' | 'activeProfile' | 'handoffTargets' | 'nextPhase' | 'decision'>> = {
  dx: {
    memoriaDefaults: {
      reportType: 'diagnostic-shielding',
      recommendedEquipmentKeys: ['pet_ct_fdg', 'spect_tcm', 'cbct_igrt'],
      requiredSections: ['Plano y zonas', 'Equipo RX/CT/fluoro', 'Workload semanal', 'Barreras primarias/secundarias', 'Ocupacion', 'NCRP 147/IPEM 109'],
      methodFocus: ['NCRP 147', 'scatter workload', 'floor/ceiling', 'public/work areas'],
      firstPrompt: 'Construir memoria diagnostica desde el plano, equipo RX/CT/fluoro, workload, ocupacion y barreras.',
    },
    reportDefaults: {
      templateId: 'cnsns-dx-ncrp147',
      title: 'Memoria analitica diagnostica NCRP 147',
      appendixOrder: ['layout', 'equipment', 'workload', 'barrier-results', 'citation-ledger'],
      exportTags: ['DX', 'NCRP147', 'IPEM109', 'CNSNS'],
    },
    evidenceDefaults: {
      objective: 'Sustentar memoria diagnostica con NCRP 147, IPEM 109, workload, ocupacion y evidencia del plano.',
      priorityDocuments: ['NCRP 147', 'IPEM 109', NOM_008_NUCL.clave, 'manual fabricante RX/CT'],
      ragQueries: ['NCRP 147 diagnostic workload barrier shielding', 'IPEM 109 SPECT CT shielding room design', 'occupancy factor diagnostic radiology shielding'],
      citationTags: ['DX', 'diagnostico', 'NCRP147', 'IPEM109'],
    },
  },
  tx: {
    memoriaDefaults: {
      reportType: 'therapy-bunker-shielding',
      recommendedEquipmentKeys: ['linac_6mv', 'linac_10mv', 'linac_15mv', 'gamma_knife_perfexion', 'hdr_ir192'],
      requiredSections: ['Bunker', 'Isocentro', 'Energia', 'Workload Gy/semana', 'Uso U', 'Ocupacion T', 'Laberinto/puerta', 'Neutrones si >10 MV'],
      methodFocus: ['NCRP 151', 'primary barrier', 'secondary leakage/scatter', 'maze', 'neutrons'],
      firstPrompt: 'Construir memoria de terapia con isocentro, energia, workload, barreras primarias/secundarias, puerta y laberinto.',
    },
    reportDefaults: {
      templateId: 'cnsns-tx-ncrp151',
      title: 'Memoria analitica de terapia NCRP 151',
      appendixOrder: ['layout', 'isocenter', 'workload', 'barrier-results', 'maze-neutrons', 'citation-ledger'],
      exportTags: ['TX', 'NCRP151', 'LINAC', 'CNSNS'],
    },
    evidenceDefaults: {
      objective: 'Sustentar memoria de terapia con NCRP 151, IAEA SRS-47, factores WUT, laberinto y resultados de blindaje.',
      priorityDocuments: ['NCRP 151', 'IAEA SRS-47', 'CNSNS LA-007/01', 'manual LINAC/Gamma Knife/HDR'],
      ragQueries: ['NCRP 151 primary secondary barrier WUT', 'NCRP 151 maze neutron door shielding', 'IAEA SRS 47 radiotherapy facility shielding'],
      citationTags: ['TX', 'terapia', 'NCRP151', 'IAEA-SRS47'],
    },
  },
  nm: {
    memoriaDefaults: {
      reportType: 'nuclear-medicine-shielding',
      recommendedEquipmentKeys: ['pet_ct_fdg', 'spect_tcm'],
      requiredSections: ['Radionuclido', 'Actividad administrada', 'Tiempos', 'Uptake/scan/hot lab', 'Residuos', 'Pacientes', 'Dosimetria interna'],
      methodFocus: ['AAPM TG-108', '511 keV PET', 'SPECT Tc-99m', 'storage/decay', 'patient self-shielding'],
      firstPrompt: 'Construir memoria de medicina nuclear con radionuclido, actividad, tiempos, ocupacion, hot lab y rutas de pacientes.',
    },
    reportDefaults: {
      templateId: 'cnsns-nm-tg108',
      title: 'Memoria analitica de medicina nuclear TG-108',
      appendixOrder: ['layout', 'radionuclide', 'activity-times', 'controlled-zones', 'waste-storage', 'citation-ledger'],
      exportTags: ['NM', 'TG108', 'PET', 'SPECT', 'ICRP'],
    },
    evidenceDefaults: {
      objective: 'Sustentar memoria de medicina nuclear con TG-108, NCRP 147/155, ICRP y trazabilidad de actividad/tiempos.',
      priorityDocuments: ['AAPM TG-108', 'NCRP 147/155', 'ICRP 128/133/155', 'manual PET/SPECT'],
      ragQueries: ['AAPM TG 108 PET shielding uptake room', '511 keV PET CT shielding calculation', 'ICRP internal dosimetry diagnostic nuclear medicine'],
      citationTags: ['NM', 'PET', 'SPECT', 'TG108', 'ICRP'],
    },
  },
  cy: {
    memoriaDefaults: {
      reportType: 'cyclotron-radiofarmacia-shielding',
      recommendedEquipmentKeys: ['cyclotron_18mev'],
      requiredSections: ['Energia de protones', 'Target cave', 'Neutrones', 'Activacion', 'Hot cells', 'Ventilacion', 'Produccion radiofarmaceutica'],
      methodFocus: ['IAEA SRS-47', 'NCRP 151/144', 'neutron shielding', 'activation', 'skyshine'],
      firstPrompt: 'Construir memoria de ciclotron con target, produccion, neutrones, activacion, ventilacion y blindaje masivo.',
    },
    reportDefaults: {
      templateId: 'cnsns-cy-iaea-srs47',
      title: 'Memoria analitica de ciclotron y radiofarmacia',
      appendixOrder: ['layout', 'cyclotron-target', 'neutron-results', 'activation', 'ventilation', 'citation-ledger'],
      exportTags: ['CY', 'IAEA-SRS47', 'NCRP151', 'neutrons'],
    },
    evidenceDefaults: {
      objective: 'Sustentar memoria de ciclotron con evidencia de neutrones, activacion, target cave, ventilacion y skyshine.',
      priorityDocuments: ['IAEA SRS-47', 'NCRP 151', 'NCRP 144', 'manual Cyclone/KIUBE'],
      ragQueries: ['cyclotron 18 MeV shielding neutron target cave', 'IAEA SRS 47 cyclotron shielding design', 'NCRP 144 neutron activation shielding'],
      citationTags: ['CY', 'ciclotron', 'neutrones', 'activacion'],
    },
  },
};

export function readF117ActiveProfileId(fallback: F113ModalityProfileId = 'dx'): F113ModalityProfileId {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(F117_ACTIVE_PROFILE_KEY);
    if (value && F113_MODALITY_PROFILES.some((profile) => profile.id === value)) return value as F113ModalityProfileId;
  } catch {
    return fallback;
  }
  return fallback;
}

export function buildF117ModalityHandoff(activeProfileId: F113ModalityProfileId = readF117ActiveProfileId()): F117ModalityHandoff {
  const activeProfile = F113_MODALITY_PROFILES.find((profile) => profile.id === activeProfileId) ?? F113_MODALITY_PROFILES[0];
  return {
    phase: 'F117',
    status: 'implemented-additive',
    storageKey: F117_ACTIVE_PROFILE_KEY,
    activeProfile,
    ...defaultsByProfile[activeProfile.id],
    handoffTargets: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'RAG deep dive', 'CNSNS export'],
    nextPhase: 'F118 should make profile-aware opening actions: selected profile preselects equipment family and report template when dialogs open.',
    decision: 'F117 connects persistent DX/TX/NM/CY profiles to Memoria IA, report defaults and Evidence Pack routing without changing calculation formulas.',
  };
}

export function buildF117ImplementationSummary() {
  return {
    phase: 'F117' as const,
    status: 'implemented-additive' as const,
    profiles: F113_MODALITY_PROFILES.map((profile) => profile.label),
    targets: ['Memoria IA', 'PDF Report', 'Evidence Pack'],
    storageKey: F117_ACTIVE_PROFILE_KEY,
    nextPhase: 'F118 profile-aware dialog opening and optional auto-preselection.',
    decision: 'Use active modality as guidance and routing metadata first; keep user confirmation before applying equipment or calculation defaults.',
  };
}
