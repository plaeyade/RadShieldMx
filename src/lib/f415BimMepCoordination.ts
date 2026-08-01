export interface F415MepSystemLayer {
  id: string;
  label: string;
  color: string;
  bimCategory: 'IfcFlowSegment' | 'IfcDuctSegment' | 'IfcCableCarrierSegment' | 'IfcOpeningElement' | 'IfcBuildingElementProxy';
  radiologicalRisk: 'low' | 'medium' | 'high';
  requiredChecks: string[];
}

export interface F415BimMepGate {
  id: string;
  label: string;
  owner: 'CAD/BIM' | 'Fisica Medica' | 'Estructura' | 'Obra/MEP';
  rule: string;
  releaseBlocking: boolean;
}

export interface F415ShieldingStoryStep {
  id: string;
  label: string;
  message: string;
  canvasUse: string;
}

export interface F415ShieldingSurfaceRole {
  id: string;
  label: string;
  color: string;
  function: string;
  memoryRequirement: string;
}

export interface F415DesignQuestion {
  id: string;
  question: string;
  requiredEvidence: string;
}

export interface F415ReferenceStandard {
  id: string;
  label: string;
  application: string;
  traceabilityRule: string;
}

export interface F415BimMepCoordinationPlan {
  schema: 'radshield-mx.f415.bim-mep-coordination.v1';
  phase: 'F415';
  status: 'coordination-ready';
  visualReference: string[];
  systemLayers: F415MepSystemLayer[];
  gates: F415BimMepGate[];
  canvasActions: Array<{ id: string; label: string; action: string }>;
  shieldingStory: F415ShieldingStoryStep[];
  surfaceRoles: F415ShieldingSurfaceRole[];
  designQuestions: F415DesignQuestion[];
  referenceStandards: F415ReferenceStandard[];
}

export function buildF415BimMepCoordinationPlan(): F415BimMepCoordinationPlan {
  return {
    schema: 'radshield-mx.f415.bim-mep-coordination.v1',
    phase: 'F415',
    status: 'coordination-ready',
    visualReference: [
      'Los videos muestran modelos MEP/BIM con tuberias, ductos, charolas, soportes, puertas y muros coloreados por sistema.',
      'Para RadShield-MX, el valor clinico es detectar penetraciones, interferencias, rutas de fuga, accesos de mantenimiento y cargas estructurales antes de cerrar memoria.',
      'Las imagenes Fisica Medica agregan una narrativa clara: el cuarto visible es solo una parte; la estructura real incluye blindaje, barreras por funcion, laberinto, puerta, evidencia normativa y preguntas de diseno.',
    ],
    systemLayers: [
      {
        id: 'shielding-walls',
        label: 'Muros/losas de blindaje',
        color: '#22c55e',
        bimCategory: 'IfcBuildingElementProxy',
        radiologicalRisk: 'high',
        requiredChecks: ['espesor requerido', 'densidad/TVL versionada', 'carga kg/m2', 'continuidad contra penetraciones'],
      },
      {
        id: 'hvac-ducts',
        label: 'HVAC / ductos',
        color: '#38bdf8',
        bimCategory: 'IfcDuctSegment',
        radiologicalRisk: 'high',
        requiredChecks: ['cruce de barrera', 'compensacion de blindaje', 'laberinto o sleeve', 'evidencia fotografica/plano'],
      },
      {
        id: 'pipes',
        label: 'Tuberias / gases / agua',
        color: '#ef4444',
        bimCategory: 'IfcFlowSegment',
        radiologicalRisk: 'medium',
        requiredChecks: ['diametro', 'material', 'trayectoria', 'sello de penetracion', 'distancia a fuente'],
      },
      {
        id: 'cable-trays',
        label: 'Charolas / cableado',
        color: '#a855f7',
        bimCategory: 'IfcCableCarrierSegment',
        radiologicalRisk: 'medium',
        requiredChecks: ['pasamuros', 'canalizacion', 'blindaje local', 'acceso mantenimiento'],
      },
      {
        id: 'openings',
        label: 'Penetraciones / puertas',
        color: '#f59e0b',
        bimCategory: 'IfcOpeningElement',
        radiologicalRisk: 'high',
        requiredChecks: ['ubicacion exacta', 'dimensiones', 'equivalente Pb/concreto', 'revision fisico medico'],
      },
    ],
    gates: [
      {
        id: 'penetration-register',
        label: 'Registro de penetraciones',
        owner: 'Fisica Medica',
        rule: 'Toda entidad que cruza barrera debe crear entrada en Evidence Pack con ubicacion, dimensiones, sistema y mitigacion.',
        releaseBlocking: true,
      },
      {
        id: 'mep-clash',
        label: 'Clash MEP/blindaje',
        owner: 'CAD/BIM',
        rule: 'Cruces de ductos/tuberias/charolas contra barreras deben marcarse en canvas y plano 3D antes de reporte.',
        releaseBlocking: true,
      },
      {
        id: 'structural-load',
        label: 'Carga estructural',
        owner: 'Estructura',
        rule: 'Materiales HD y equipos pesados deben sumar carga kg/m2 y emitir advertencia si falta revision estructural.',
        releaseBlocking: true,
      },
      {
        id: 'maintenance-access',
        label: 'Acceso y mantenimiento',
        owner: 'Obra/MEP',
        rule: 'Rutas de servicio no deben abrir trayectorias directas de fuga radiologica ni bloquear controles/equipos.',
        releaseBlocking: false,
      },
    ],
    canvasActions: [
      { id: 'add-penetration', label: 'Agregar penetracion', action: 'Crear marcador de cruce con barrera y evidencia requerida.' },
      { id: 'toggle-mep', label: 'Alternar MEP', action: 'Mostrar/ocultar ductos, tuberias, charolas y soportes por capa.' },
      { id: 'clash-check', label: 'Revisar interferencias', action: 'Listar cruces MEP/blindaje y bloquear export si falta mitigacion.' },
      { id: 'view-shaded-edges', label: 'Shaded + edges', action: 'Activar inspeccion 3D/2.5D con aristas y colores disciplinares.' },
    ],
    shieldingStory: [
      {
        id: 'visible-vs-real',
        label: 'Visible vs real',
        message: 'La sala clinica visible es menor que el bunker real; la mayor parte del volumen corresponde a blindaje.',
        canvasUse: 'Mostrar cutaway 2.5D con espesor real, volumen total, espacio visible y masa/carga estructural.',
      },
      {
        id: 'different-wall-jobs',
        label: 'Cada muro tiene funcion',
        message: 'Barrera primaria, secundaria, laberinto y puerta no se calculan ni justifican igual.',
        canvasUse: 'Colorear superficies por rol y exigir formula, norma, inputs, outputs y cita por cada rol.',
      },
      {
        id: 'before-first-patient',
        label: 'Antes del primer paciente',
        message: 'El diseno debe responder donde va la radiacion, que espesor requiere, quien necesita proteccion, como se controla fuga y si es seguro.',
        canvasUse: 'Convertir esas preguntas en checklist de Memoria IA antes de exportar PDF/Evidence Pack.',
      },
      {
        id: 'standards-backed',
        label: 'Respaldado por normas',
        message: 'IAEA, AAPM, ICRU, NCRP y reglas locales deben aparecer como evidencia versionada, no como texto generico.',
        canvasUse: 'Adjuntar citationIds, pagina/hash y prioridad normativa a cada calculo y decision de diseno.',
      },
    ],
    surfaceRoles: [
      {
        id: 'primary-barrier',
        label: 'Barrera primaria',
        color: '#ef4444',
        function: 'Recibe haz directo y normalmente gobierna el mayor espesor.',
        memoryRequirement: 'Debe incluir energia, carga W, uso U, ocupacion T, distancia, P, TVL, material y cita NCRP/IAEA/UAQ.',
      },
      {
        id: 'secondary-barrier',
        label: 'Barrera secundaria',
        color: '#f59e0b',
        function: 'Controla fuga de cabezal y radiacion dispersa.',
        memoryRequirement: 'Debe separar leakage/scatter, usar geometria de paciente/campo y advertir neutrones si energia supera umbral.',
      },
      {
        id: 'maze',
        label: 'Laberinto',
        color: '#0ea5e9',
        function: 'Evita trayectoria directa de radiacion hacia acceso.',
        memoryRequirement: 'Debe justificar longitud, giros, dispersores, puerta y puntos de control.',
      },
      {
        id: 'door',
        label: 'Puerta blindada',
        color: '#8b5cf6',
        function: 'Mantiene continuidad de blindaje en el acceso.',
        memoryRequirement: 'Debe incluir equivalente de material, solapes, marco, interlocks, area controlada y evidencia de proveedor.',
      },
    ],
    designQuestions: [
      {
        id: 'where-radiation-goes',
        question: 'Donde ira la radiacion?',
        requiredEvidence: 'Haz, isocentro, angulos, energia, workload y fuente/equipo seleccionados.',
      },
      {
        id: 'wall-thickness',
        question: 'Que espesor requiere cada barrera?',
        requiredEvidence: 'Calculo trazable por superficie con TVL/densidad/material/cita/hash.',
      },
      {
        id: 'who-needs-protection',
        question: 'Quien necesita proteccion?',
        requiredEvidence: 'Zonas controladas/publicas, ocupacion, colindancias y limites de diseno.',
      },
      {
        id: 'leakage-control',
        question: 'Como se controla fuga y dispersion?',
        requiredEvidence: 'Laberinto, puerta, penetraciones, MEP, leakage/scatter y puntos criticos.',
      },
      {
        id: 'safe-before-build',
        question: 'Es seguro antes de construir?',
        requiredEvidence: 'QA numerico, Evidence Pack, checklist CNSNS/UAQ/NCRP/IAEA y revision profesional.',
      },
    ],
    referenceStandards: [
      {
        id: 'iaea-sr47',
        label: 'IAEA Safety Reports Series 47',
        application: 'Diseno y proteccion radiologica de instalaciones de radioterapia.',
        traceabilityRule: 'Usar como guia internacional y citar pagina/hash cuando respalde metodologia o criterios de diseno.',
      },
      {
        id: 'aapm-tg108',
        label: 'AAPM TG-108',
        application: 'PET/medicina nuclear, control de calidad y consideraciones de blindaje segun modalidad.',
        traceabilityRule: 'Usar en perfiles NM/PET y registrar si aplica o no al equipo actual.',
      },
      {
        id: 'icru-83',
        label: 'ICRU Report 83',
        application: 'Prescripcion, registro y reporte en IMRT/radioterapia.',
        traceabilityRule: 'Usar como contexto dosimetrico/documental, no como sustituto de calculo estructural de blindaje.',
      },
      {
        id: 'ncrp-151',
        label: 'NCRP Report 151',
        application: 'Diseno/evaluacion de blindaje para instalaciones de megavoltaje y gamma-ray.',
        traceabilityRule: 'Fuente primaria para LINAC/Gamma Knife cuando exista pagina/chunk versionado en RAG.',
      },
      {
        id: 'local-regulations',
        label: 'Normativa local CNSNS/UAQ',
        application: 'Criterios locales, memoria analitica, permisos, limites y evidencia requerida.',
        traceabilityRule: 'Tiene prioridad de cumplimiento local y debe quedar en checklist final.',
      },
    ],
  };
}
