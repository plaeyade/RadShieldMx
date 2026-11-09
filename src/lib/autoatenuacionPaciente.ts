/**
 * Autoatenuación del paciente (Fase 8d). Sólo TG-108 da un factor citado: a 511 keV el cuerpo absorbe
 * 0.36 de la radiación (`ABSORCION_PACIENTE`), así que la tasa que sale del paciente es 0.64 de la de una
 * fuente puntual en aire. Para TC, NCRP 147 §5.6 ya mide el kerma de dispersión (K¹_sec por DLP) con fantoma,
 * por lo que no corresponde otra reducción; para SPECT no hay factor normativo. En ambos casos el factor es 1
 * (sin reducción, conservador). Antes el diálogo usaba factores propios (PET F-18 0.70; TC 0.60–0.75; SPECT
 * 0.50–0.55) atribuidos a una «Tabla 3» de TG-108 que no existe.
 */
import { ABSORCION_PACIENTE } from './tg108';

export interface FactorAutoatenuacion {
  modalidad: string;
  /** Fracción que sale del paciente (1 = sin reducción). */
  factor: number;
  descripcion: string;
  referencia: string;
  /** true si el factor viene de una referencia normativa. */
  citado: boolean;
}

const PET = 1 - ABSORCION_PACIENTE;

export const FACTORES_AUTOATENUACION: Record<string, FactorAutoatenuacion> = {
  PET_F18: {
    modalidad: 'PET/CT — F-18', factor: PET, citado: true,
    descripcion: '511 keV; el cuerpo absorbe 0.36 (Γ_paciente = 0.092 μSv·m²/(MBq·h)).',
    referencia: 'AAPM TG-108 (2006), absorción del paciente 0.36',
  },
  PET_GA68: {
    modalidad: 'PET/CT — Ga-68', factor: PET, citado: true,
    descripcion: '511 keV; misma absorción del paciente que F-18.',
    referencia: 'AAPM TG-108 (2006), absorción del paciente 0.36',
  },
  CT: {
    modalidad: 'TC (cabeza o cuerpo)', factor: 1, citado: false,
    descripcion: 'K¹_sec por DLP de NCRP 147 ya se midió con fantoma: no se aplica otra reducción.',
    referencia: 'NCRP 147 §5.6 (sin factor adicional)',
  },
  SPECT_TC99M: {
    modalidad: 'SPECT — Tc-99m', factor: 1, citado: false,
    descripcion: '140 keV; sin factor normativo: se diseña con la fuente sin reducción (conservador).',
    referencia: 'Sin referencia normativa',
  },
  SPECT_I131: {
    modalidad: 'SPECT — I-131', factor: 1, citado: false,
    descripcion: '364 keV; sin factor normativo: se diseña con la fuente sin reducción (conservador).',
    referencia: 'Sin referencia normativa',
  },
};

/** Carga (o tasa) efectiva tras la autoatenuación y su reducción porcentual. */
export function cargaConAutoatenuacion(clave: string, carga: number): { efectiva: number; reduccion_pct: number } {
  const f = FACTORES_AUTOATENUACION[clave];
  if (!f) throw new Error(`Modalidad sin factor: ${clave}`);
  return { efectiva: carga * f.factor, reduccion_pct: (1 - f.factor) * 100 };
}
