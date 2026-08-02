export type F515F520TrackStatus = 'ready' | 'gated' | 'blocked' | 'needs-assets' | 'needs-data';

export interface F515F520PostBetaTrack {
  phase: 'F515' | 'F516' | 'F517' | 'F518' | 'F519' | 'F520';
  title: string;
  status: F515F520TrackStatus;
  objective: string;
  deliverables: string[];
  exitCriteria: string[];
  riskControls: string[];
  nextAction: string;
}

export interface F515F520PostBetaPlan {
  schema: 'radshield-mx.post-beta.f515-f520.v1';
  phaseRange: 'F515-F520';
  status: 'post-beta-plan-ready';
  betaBaseline: 'F511-F514 beta closure accepted';
  tracks: F515F520PostBetaTrack[];
  executionOrder: string[];
  doNotClaimYet: string[];
  outputDir: 'outputs/f515_f520_post_beta_plan';
}

export function buildF515F520PostBetaPlan(): F515F520PostBetaPlan {
  return {
    schema: 'radshield-mx.post-beta.f515-f520.v1',
    phaseRange: 'F515-F520',
    status: 'post-beta-plan-ready',
    betaBaseline: 'F511-F514 beta closure accepted',
    outputDir: 'outputs/f515_f520_post_beta_plan',
    tracks: [
      {
        phase: 'F515',
        title: 'Renderer base y eventos del canvas',
        status: 'ready',
        objective:
          'Endurecer la capa base de eventos antes de cambios CAD profundos: pointer routing, seleccion, drag, lasso, snap, pan, zoom, delete y undo.',
        deliverables: [
          'Matriz CanvasArea -> useCanvas -> eventControllerV2.',
          'Contrato de no regresion: canvas no blanco, sidebar visible, menu Archivo alineado y paneles no obstructivos.',
          'Lista de acciones migrables desde ruta estable a controller v2.',
        ],
        exitCriteria: [
          'Toda accion nueva cae por default en ruta estable si el flag v2 no esta activo.',
          'Eventos con coordenadas no finitas se ignoran.',
          'Delete/undo/pan/zoom/snap/lasso/drag tienen rutas identificables y cubiertas por QA.',
          'No se modifica geometria persistente sin E2E dedicado.',
        ],
        riskControls: [
          'Mantener feature gate para cambios de eventos profundos.',
          'Separar renderer visual de mutacion de estado.',
          'Registrar rollback por flag y por release package anterior.',
        ],
        nextAction: 'Crear QA especifico para eventos reales y luego migrar una sola accion de bajo riesgo.',
      },
      {
        phase: 'F516',
        title: 'Babylon profundo real',
        status: 'gated',
        objective:
          'Convertir Babylon de parity/runtime card a escena real interactiva con malla de bunker, capas, materiales PBR y controles de recorrido.',
        deliverables: [
          'Loader Babylon con import lazy.',
          'Escena con paredes, losas, equipo, materiales, luces y etiquetas.',
          'QA de render no blanco y fallback a Three/R3F si falla.',
        ],
        exitCriteria: [
          'Babylon carga solo bajo demanda.',
          'El fallback visual no rompe Three/R3F ni canvas 2D.',
          'La escena exporta una imagen/evidence visual reproducible.',
        ],
        riskControls: [
          'No hacerlo renderer principal hasta pasar E2E.',
          'Mantener Three/R3F como visual estable.',
          'Lazy import para evitar aumentar costo inicial del bundle.',
        ],
        nextAction: 'Auditar dependencia @babylonjs/* y completar smoke visual profundo con URL local.',
      },
      {
        phase: 'F517',
        title: 'Unity WebGL con build exportado real',
        status: 'needs-assets',
        objective: 'Integrar un build Unity WebGL exportado real sin confundirlo con stub o placeholder.',
        deliverables: [
          'Manifest de build Unity exportado.',
          'Validador de index.html, Build/*.loader.js, Build/*.framework.js, Build/*.data, Build/*.wasm y TemplateData.',
          'Bridge de handoff desde RadShield-MX con contexto de memoria/plano.',
        ],
        exitCriteria: [
          'El build real existe en public/unity/radshield-medical-3d.',
          'El loader abre en iframe/ruta aislada sin romper la app.',
          'Hay fallback si el build falta o pesa demasiado.',
        ],
        riskControls: [
          'No incluir assets gigantes en ZIP beta si no estan versionados.',
          'Validar licencias y runtime antes de publicar.',
          'Mantener Unity como visor opcional, no dependencia del calculo.',
        ],
        nextAction: 'Copiar build exportado real y correr contrato F475-F478 antes de promover.',
      },
      {
        phase: 'F518',
        title: 'DB tecnica ENDF/XCOM/ICRU',
        status: 'needs-data',
        objective:
          'Pasar de valores puntuales a una base tecnica versionada para energias, secciones eficaces, mezclas, materiales y trazabilidad documental.',
        deliverables: [
          'Inventario de fuentes ENDF/XCOM/ICRU permitidas.',
          'Schema extension para datasets tabulados, mezclas y curvas interpolables.',
          'Politica approved-reference antes de alimentar calculo.',
        ],
        exitCriteria: [
          'Cada dataset tiene version, fuente, pagina/URL, hash y licencia.',
          'Los calculos usan datasets approved-reference o emiten warning.',
          'La interpolacion queda testeada contra casos conocidos.',
        ],
        riskControls: [
          'No declarar Monte Carlo clinico certificado sin datasets completos y QA externo.',
          'Separar datos regulatorios, proveedor, laboratorio y memorias previas.',
          'Seed dry-run antes de DB live.',
        ],
        nextAction: 'Definir fuentes canonicas y ampliar F491-F498 con tablas de curvas/datasets.',
      },
      {
        phase: 'F519',
        title: 'QA numerico NCRP/IAEA/UAQ ampliado',
        status: 'ready',
        objective:
          'Aumentar casos de regresion numerica por modalidad para que el motor de calculo sea robusto antes de release estable.',
        deliverables: [
          'Casos LINAC 6 MV, LINAC 15/18 MV, CT/RX, Gamma Knife, PET/NM y ciclotron.',
          'Comparador base/conservador por barrera.',
          'Warnings clinicos con formula, norma, entrada, salida y cita.',
        ],
        exitCriteria: [
          'Cada caso tiene expected range, tolerancia y fuente.',
          'Fallo numerico bloquea release estable.',
          'Warnings se propagan a Memoria IA, PDF y Evidence Pack.',
        ],
        riskControls: [
          'Mantener casos preliminares separados de casos certificados.',
          'No mezclar datos sin revision con constants de calculo.',
          'Reportar incertidumbre y supuestos.',
        ],
        nextAction: 'Extender F484-F490 con casos reales adicionales y DB-backed readback.',
      },
      {
        phase: 'F520',
        title: 'Memorias reales para RAG/IA',
        status: 'needs-data',
        objective:
          'Ingerir memorias reales deduplicadas para mejorar busqueda, estructura de Memoria IA y evidencia sin contaminar calculos normativos.',
        deliverables: [
          'Cola de ingestion con hash, OCR, idioma, modalidad y estado de aprobacion.',
          'Chunks con pagina y hash por memoria.',
          'Plantillas de memoria por DX/TX/NM/CY alimentadas por evidencia.',
        ],
        exitCriteria: [
          'Duplicados exactos y casi duplicados quedan identificados.',
          'OCR pendiente queda separado de texto confiable.',
          'RAG cita memoria como evidencia historica, no como norma primaria.',
        ],
        riskControls: [
          'No usar memorias previas como fuente normativa dominante.',
          'Separar datos personales/sensibles antes de publicar.',
          'Mantener auditoria de chunk y documento original.',
        ],
        nextAction: 'Preparar batch de nuevas memorias reales con OCR espanol y deduplicacion hash/page.',
      },
    ],
    executionOrder: [
      'F515 primero: estabiliza eventos/render base del canvas.',
      'F519 en paralelo: aumenta QA numerico sin tocar UI.',
      'F520 cuando entren memorias reales revisadas.',
      'F518 despues de acordar datasets canonicos.',
      'F516 cuando F515 no tenga regresiones.',
      'F517 solo al recibir/copy Unity WebGL exportado real.',
    ],
    doNotClaimYet: [
      'Babylon como renderer principal productivo.',
      'Unity WebGL real integrado si falta build exportado.',
      'Monte Carlo clinico certificado.',
      'DB ENDF/XCOM/ICRU completa.',
      'Memoria analitica firmable sin revision FM/RSO.',
    ],
  };
}
