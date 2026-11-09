import { rutaPublica } from '@/lib/rutaPublica';
import type { RadiationSource } from '@/types/radshield';

export type EquipmentIconKind =
  | 'linac'
  | 'gammaKnife'
  | 'ct'
  | 'petct'
  | 'hdr'
  | 'cyclotron'
  | 'spect'
  | 'mammography'
  | 'generic';

export interface EquipmentVisualProfile {
  iconKind: EquipmentIconKind;
  label: string;
  shortLabel: string;
  color: string;
  accentColor: string;
  footprint_m: {
    width: number;
    depth: number;
  };
  preferredAsset?: string;
  ragTags: string[];
}

const profiles: Record<EquipmentIconKind, EquipmentVisualProfile> = {
  linac: {
    iconKind: 'linac',
    label: 'LINAC',
    shortLabel: 'LX',
    color: '#2563eb',
    accentColor: '#38bdf8',
    footprint_m: { width: 3.2, depth: 4.2 },
    preferredAsset: rutaPublica('equipment-images/3_TrueBeam_Linear_Accelerator_Radiotherapy.png'),
    ragTags: ['NCRP151', 'LINAC', 'primary-barrier', 'secondary-barrier'],
  },
  gammaKnife: {
    iconKind: 'gammaKnife',
    label: 'Gamma Knife',
    shortLabel: 'GK',
    color: '#7c3aed',
    accentColor: '#c4b5fd',
    footprint_m: { width: 2.8, depth: 3.1 },
    preferredAsset: rutaPublica('equipment-images/7_Leksell_Gamma_Knife_Icon_.png'),
    ragTags: ['AAPMTG56', 'Co60', 'stereotactic', 'maze'],
  },
  ct: {
    iconKind: 'ct',
    label: 'CT',
    shortLabel: 'CT',
    color: '#0891b2',
    accentColor: '#67e8f9',
    footprint_m: { width: 2.5, depth: 4.6 },
    preferredAsset: rutaPublica('equipment-images/6_CT_Scanners_National_Imaging_Solution.png'),
    ragTags: ['NCRP147', 'CT', 'scatter', 'workload'],
  },
  petct: {
    iconKind: 'petct',
    label: 'PET/CT',
    shortLabel: 'PT',
    color: '#16a34a',
    accentColor: '#86efac',
    footprint_m: { width: 2.8, depth: 5.0 },
    preferredAsset: rutaPublica('equipment-images/1_Biograph_Vision_PET_CT_Scanner.png'),
    ragTags: ['AAPMTG108', 'PET', 'F18', '511keV'],
  },
  hdr: {
    iconKind: 'hdr',
    label: 'HDR',
    shortLabel: 'HDR',
    color: '#dc2626',
    accentColor: '#fca5a5',
    footprint_m: { width: 1.4, depth: 1.8 },
    preferredAsset: rutaPublica('equipment-images/4_Elekta_Flexitron_Afterloader_For.png'),
    ragTags: ['NCRP151', 'HDR', 'Ir192', 'brachytherapy'],
  },
  cyclotron: {
    iconKind: 'cyclotron',
    label: 'Cyclotron',
    shortLabel: 'CY',
    color: '#ea580c',
    accentColor: '#fdba74',
    footprint_m: { width: 4.5, depth: 4.5 },
    preferredAsset: rutaPublica('equipment-images/1_Cyclone_KIUBE_IBA_Radio_Pharma_Solution.png'),
    ragTags: ['IAEA_SRS47', 'cyclotron', 'neutron', 'activation'],
  },
  spect: {
    iconKind: 'spect',
    label: 'SPECT',
    shortLabel: 'SP',
    color: '#0f766e',
    accentColor: '#5eead4',
    footprint_m: { width: 2.6, depth: 3.4 },
    preferredAsset: rutaPublica('equipment-images/3_NM_CT_860_SPECT_CT_Sytem_GE_HealthCare.png'),
    ragTags: ['TG108', 'SPECT', 'Tc99m', 'gamma-camera'],
  },
  mammography: {
    iconKind: 'mammography',
    label: 'Mammography',
    shortLabel: 'MG',
    color: '#be185d',
    accentColor: '#f9a8d4',
    footprint_m: { width: 1.8, depth: 2.2 },
    preferredAsset: rutaPublica('equipment-images/2_Selenia_Dimensions_Mammography_System.png'),
    ragTags: ['NCRP147', 'mammography', 'low-energy', 'lead-equivalent'],
  },
  generic: {
    iconKind: 'generic',
    label: 'Source',
    shortLabel: 'SRC',
    color: '#c53030',
    accentColor: '#fecaca',
    footprint_m: { width: 1.6, depth: 1.6 },
    ragTags: ['source', 'shielding'],
  },
};

export function getEquipmentIconKindFromText(value: string): EquipmentIconKind {
  const text = value.toLowerCase();
  if (/linac|versa|truebeam|halcyon|accelerator|vitalbeam|primus|artiste/.test(text)) return 'linac';
  if (/gamma\s*knife|leksell|perfexion|esprit/.test(text)) return 'gammaKnife';
  if (/pet|biograph|discovery\s+mi|vereos|f-18|511/.test(text)) return 'petct';
  if (/\bct\b|tomograf|somatom|revolution|aquilion|iqon/.test(text)) return 'ct';
  if (/hdr|braqui|bravos|flexitron|ir-192|ir192/.test(text)) return 'hdr';
  if (/cyclotron|ciclotron|kiube|pettrace|proton/.test(text)) return 'cyclotron';
  if (/spect|gamma cam|tc-99|tc99|symbia|intevo/.test(text)) return 'spect';
  if (/mammo|masto|senographe|selenia/.test(text)) return 'mammography';
  return 'generic';
}

export function getEquipmentVisualProfile(source: RadiationSource): EquipmentVisualProfile {
  const text = [
    source.name,
    source.modality?.id,
    source.modality?.name,
    source.modality?.category,
    source.modality?.standard,
    source.modality?.energyLabel,
  ].filter(Boolean).join(' ');

  return profiles[getEquipmentIconKindFromText(text)];
}

export function getEquipmentVisualProfileByKind(kind: EquipmentIconKind): EquipmentVisualProfile {
  return profiles[kind] ?? profiles.generic;
}

export function listEquipmentVisualProfiles(): EquipmentVisualProfile[] {
  return Object.values(profiles);
}
