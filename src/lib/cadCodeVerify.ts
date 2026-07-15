import type { Medical3DMode, MedicalRoomPreset, MedicalScene } from './medical3D/sceneBuilder';

export type CadCodeVerifyAnswer = 'yes' | 'no' | 'unclear';

export interface CadCodeVerifyQuestion {
  id: string;
  question: string;
  answer: CadCodeVerifyAnswer;
  rationale: string;
  correctiveFeedback?: string;
}

export interface CadCodeVerifyReadinessItem {
  id: string;
  label: string;
  status: 'ready' | 'planned' | 'external';
  note: string;
}

export interface CadCodeVerificationPack {
  schemaVersion: 'radshield-cadcodeverify-pack-v1';
  generatedBy: 'RadShield-MX Medical 3D Floor Plan';
  generatedAt: string;
  sourcePaper: {
    title: string;
    url: 'https://arxiv.org/pdf/2410.05340';
    method: 'CADCodeVerify';
  };
  integrationMode: 'deterministic-scene-verification' | 'external-vlm-refinement';
  room: {
    name: string;
    preset: MedicalRoomPreset;
    mode: Medical3DMode;
  };
  sceneSummary: {
    barriers: number;
    equipment: number;
    primaryBarriers: number;
    secondaryBarriers: number;
    maxRequiredThickness_mm: number;
  };
  validationQuestions: CadCodeVerifyQuestion[];
  readiness: CadCodeVerifyReadinessItem[];
  recommendation: string;
}

export const CAD_CODE_VERIFY_EXTERNAL_NOTE =
  'CADCodeVerify se integra como protocolo de verificacion externa/inspirada en VLM: RadShield-MX genera preguntas y feedback auditables, pero no acepta geometria generativa sin revision fisica/regulatoria.';

export const CAD_CODE_VERIFY_READINESS: CadCodeVerifyReadinessItem[] = [
  {
    id: 'scene-qa',
    label: 'Preguntas de verificacion de escena',
    status: 'ready',
    note: 'RadShield-MX puede generar preguntas binarias sobre barreras, equipos, escala y trazabilidad.',
  },
  {
    id: 'local-answering',
    label: 'Respuestas deterministas locales',
    status: 'ready',
    note: 'Las respuestas se calculan desde la escena actual, sin depender de un VLM externo.',
  },
  {
    id: 'vlm-loop',
    label: 'Bucle VLM con imagenes 0/90/180/270',
    status: 'external',
    note: 'Fase futura: enviar capturas del visor a un VLM para feedback visual como en CADCodeVerify.',
  },
  {
    id: 'cadquery',
    label: 'CADQuery / FreeCAD parametric backend',
    status: 'planned',
    note: 'Solo despues de aislar ejecucion Python y validar seguridad de scripts generados.',
  },
  {
    id: 'regulatory-gate',
    label: 'Compuerta regulatoria',
    status: 'ready',
    note: 'Cualquier salida generativa queda marcada como no regulatoria hasta validacion profesional.',
  },
];

function answer(condition: boolean, yes: string, no: string): Pick<CadCodeVerifyQuestion, 'answer' | 'rationale'> {
  return condition
    ? { answer: 'yes', rationale: yes }
    : { answer: 'no', rationale: no };
}

export function buildCadCodeVerificationPack(input: {
  scene: MedicalScene;
  preset: MedicalRoomPreset;
  mode: Medical3DMode;
}): CadCodeVerificationPack {
  const { scene, preset, mode } = input;
  const hasGeometry = scene.walls.length > 0;
  const hasEquipment = scene.equipment.length > 0;
  const hasPrimaryOrSecondary = scene.review.primaryBarriers + scene.review.secondaryBarriers === scene.walls.length;
  const hasThickness = scene.review.maxRequiredThickness_mm > 0 || scene.walls.length === 0;
  const hasReasonableBounds = scene.bounds.width >= 3 && scene.bounds.depth >= 3;

  const q1 = answer(
    hasGeometry,
    `La escena contiene ${scene.walls.length} barreras exportables.`,
    'No hay barreras en la escena; el modelo 3D no puede sustentar revision de blindaje.',
  );
  const q2 = answer(
    hasEquipment,
    `La escena contiene ${scene.equipment.length} equipo(s) clinico(s).`,
    'No se detecta equipo clinico; la revision visual puede perder contexto de fuente.',
  );
  const q3 = answer(
    hasPrimaryOrSecondary,
    'Todas las barreras estan clasificadas dentro del resumen primaria/secundaria.',
    'Existe una discrepancia entre total de barreras y clasificacion primaria/secundaria.',
  );
  const q4 = answer(
    hasThickness,
    `Espesor maximo registrado: ${Math.round(scene.review.maxRequiredThickness_mm)} mm.`,
    'No hay espesor requerido registrado; se requiere recalculo antes de memoria analitica.',
  );
  const q5 = answer(
    hasReasonableBounds,
    `Dimensiones de escena razonables: ${scene.bounds.width.toFixed(1)} m x ${scene.bounds.depth.toFixed(1)} m.`,
    'Las dimensiones de escena parecen demasiado pequenas para revision clinica.',
  );

  const validationQuestions: CadCodeVerifyQuestion[] = [
    {
      id: 'barriers-present',
      question: 'Does the 3D scene preserve shielding barrier geometry from the source floor plan?',
      ...q1,
      correctiveFeedback: hasGeometry ? undefined : 'Importe o dibuje barreras antes de exportar objetos CAD/render.',
    },
    {
      id: 'equipment-present',
      question: 'Does the scene include clinical equipment needed to understand source placement?',
      ...q2,
      correctiveFeedback: hasEquipment ? undefined : 'Agregue fuente/equipo clinico o seleccione preset correcto antes de generar CAD.',
    },
    {
      id: 'barrier-classification',
      question: 'Are primary and secondary barriers traceable in the scene summary?',
      ...q3,
      correctiveFeedback: hasPrimaryOrSecondary ? undefined : 'Revise barreras sin clasificacion antes de exportar a CAD externo.',
    },
    {
      id: 'thickness-trace',
      question: 'Are calculated or assigned shielding thickness values available for review?',
      ...q4,
      correctiveFeedback: hasThickness ? undefined : 'Ejecute calculos de blindaje o asigne espesores antes de usar el modelo.',
    },
    {
      id: 'scale-bounds',
      question: 'Are room dimensions plausible for a medical shielding review scene?',
      ...q5,
      correctiveFeedback: hasReasonableBounds ? undefined : 'Revise escala m/px y puntos de control del plano.',
    },
  ];

  const unresolved = validationQuestions.filter((question) => question.answer !== 'yes');
  return {
    schemaVersion: 'radshield-cadcodeverify-pack-v1',
    generatedBy: 'RadShield-MX Medical 3D Floor Plan',
    generatedAt: new Date().toISOString(),
    sourcePaper: {
      title: 'Generating CAD Code with Vision-Language Models for 3D Designs',
      url: 'https://arxiv.org/pdf/2410.05340',
      method: 'CADCodeVerify',
    },
    integrationMode: 'deterministic-scene-verification',
    room: {
      name: scene.roomName,
      preset,
      mode,
    },
    sceneSummary: {
      barriers: scene.walls.length,
      equipment: scene.equipment.length,
      primaryBarriers: scene.review.primaryBarriers,
      secondaryBarriers: scene.review.secondaryBarriers,
      maxRequiredThickness_mm: Math.round(scene.review.maxRequiredThickness_mm),
    },
    validationQuestions,
    readiness: CAD_CODE_VERIFY_READINESS,
    recommendation: unresolved.length
      ? `Resolver ${unresolved.length} punto(s) antes de usar la escena como base para CAD generativo externo.`
      : 'La escena esta lista para exportar como base de revision CAD/AI externa, manteniendo validacion regulatoria separada.',
  };
}
