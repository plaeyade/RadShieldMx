export interface F199OutputSurfaceQa {
  id: string;
  label: string;
  dialogName: string;
  openerTestId: string;
  requiredSignals: string[];
  evidencePurpose: string;
  smokePolicy: string;
}

export interface F199OutputSmokeQa {
  phase: 'F199';
  status: 'implemented-output-smoke-qa';
  surfaces: F199OutputSurfaceQa[];
  canvasGuards: string[];
  nextPhase: 'F200';
  decision: string;
}

export const F199_OUTPUT_SURFACES: F199OutputSurfaceQa[] = [
  {
    id: 'memoria-ai',
    label: 'Memoria IA',
    dialogName: 'memoriaAI',
    openerTestId: 'e2e-open-memoria-ai',
    requiredSignals: [
      'memoria-evidence-snapshot',
      'f125-memoria-evidence-gate',
      'f146-material-report-appendix-memoria',
      'f149-normative-numeric-qa-memoria',
      'f149c-monte-carlo-gateway-memoria',
    ],
    evidencePurpose: 'Validar que la memoria conecte calculo, materiales, QA numerico y gateway Monte Carlo.',
    smokePolicy: 'Open hidden QA route and require evidence cards before export hardening.',
  },
  {
    id: 'pdf-report',
    label: 'PDF analitico',
    dialogName: 'pdfReport',
    openerTestId: 'e2e-open-pdf-report',
    requiredSignals: [
      'pdf-report-dialog',
      'pdf-report-evidence-f76',
      'f146-material-report-appendix',
      'f149-f149b-pdf-export-smoke',
      'f149c-monte-carlo-gateway-pdf',
    ],
    evidencePurpose: 'Validar que PDF exponga evidencia, anexo de materiales, smoke export y Monte Carlo gateway.',
    smokePolicy: 'Open hidden QA route and require report sections without invoking file download.',
  },
  {
    id: 'cnsns-report',
    label: 'Reporte CNSNS',
    dialogName: 'cnsns',
    openerTestId: 'e2e-open-cnsns-report',
    requiredSignals: ['Generar Memoria Analitica CNSNS'],
    evidencePurpose: 'Validar que el generador CNSNS siga accesible como salida normativa.',
    smokePolicy: 'Open hidden QA route and require title text.',
  },
  {
    id: 'evidence-pack',
    label: 'Evidence Pack',
    dialogName: 'evidencePack',
    openerTestId: 'e2e-open-evidence-pack',
    requiredSignals: [
      'f93-citation-ledger-summary',
      'f125-calculation-evidence-gate',
      'f126-release-evidence-hardening',
      'f149c-monte-carlo-gateway-evidence',
    ],
    evidencePurpose: 'Validar ledger de citas, calculo, evidencia release y gateway Monte Carlo.',
    smokePolicy: 'Open hidden QA route and require evidence cards.',
  },
  {
    id: 'cnsns-checklist',
    label: 'Checklist CNSNS',
    dialogName: 'cnsnsChecklist',
    openerTestId: 'e2e-open-cnsns-checklist',
    requiredSignals: ['Checklist CNSNS'],
    evidencePurpose: 'Validar checklist regulatorio previo a dictamen.',
    smokePolicy: 'Open hidden QA route and require checklist title text.',
  },
  {
    id: 'regulatory-report',
    label: 'Regulatory Report',
    dialogName: 'regulatoryReport',
    openerTestId: 'e2e-open-regulatory-report',
    requiredSignals: ['regulatory-report-dialog', 'regulatory-report-evidence-f76'],
    evidencePurpose: 'Validar salida regulatoria con evidencia F76.',
    smokePolicy: 'Open hidden QA route and require report shell plus evidence block.',
  },
  {
    id: 'batch-report-exporter',
    label: 'Batch Report Exporter',
    dialogName: 'batchReportExporter',
    openerTestId: 'e2e-open-batch-report-exporter',
    requiredSignals: ['batch-report-exporter-dialog'],
    evidencePurpose: 'Validar exportador batch como salida multiproyecto.',
    smokePolicy: 'Open hidden QA route and require title text.',
  },
];

export function buildF199OutputSmokeQa(): F199OutputSmokeQa {
  return {
    phase: 'F199',
    status: 'implemented-output-smoke-qa',
    surfaces: F199_OUTPUT_SURFACES,
    canvasGuards: [
      'f186-sidebar-stable-width',
      'f100-main-floorplan-canvas',
      'f191-pyrate-inspired-toolbar',
    ],
    nextPhase: 'F200',
    decision:
      'F199 promotes reports from menu visibility to output-surface smoke QA: Memoria IA, PDF, CNSNS, Evidence Pack, checklist, regulatory report and batch exporter must open and expose evidence signals while canvas/sidebar stay visible.',
  };
}
