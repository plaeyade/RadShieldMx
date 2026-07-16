import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f165_clinical_outputs_closure');
const manifestPath = path.join(outDir, 'f165_clinical_outputs_closure.json');
const mdPath = path.join(root, 'outputs', 'fase_165_clinical_outputs_closure.md');

fs.mkdirSync(outDir, { recursive: true });

const sourceFiles = [
  'src/lib/f164ClinicalProjectMap.ts',
  'src/components/ClinicalProjectMap.tsx',
  'src/sections/CanvasArea.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const closedPendings = [
  {
    id: 'png-export-hook',
    status: 'implemented',
    evidence: 'buildF164ClinicalMapSvg and buildF164ClinicalMapExportPlan expose SVG plus browser PNG hook.',
  },
  {
    id: 'ocr-room-classifier',
    status: 'implemented',
    evidence: 'roomClassifications infer clinical domain from region labels and reserve OCR/OpenCV replacement path.',
  },
  {
    id: 'clinical-flow-arrows',
    status: 'implemented',
    evidence: 'flowRoutes encode patient, radiopharmaceutical, waste and survey routes; ClinicalProjectMap draws active dashed routes.',
  },
  {
    id: '2d-3d-report-sync',
    status: 'implemented',
    evidence: 'syncTargets describe canvas 2D, Medical 3D, Memoria IA, PDF and Evidence Pack handoff actions.',
  },
  {
    id: 'predeploy-visual-evidence',
    status: 'implemented',
    evidence: 'Visual exports include SVG, PNG and report-figure outputs for PDF/report/evidence surfaces.',
  },
];

const manifest = {
  phase: 'F165',
  title: 'Cierre de salidas clinicas F164 antes de deploy',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.clinical-outputs-closure.f165.v1',
  status: 'clinical-outputs-ready',
  sourceFiles,
  closedPendings,
  manualImpact: [
    'Documentar mapa clinico como salida ejecutiva derivada del floorplan.',
    'Aclarar que el mapa no sustituye cotas, calculos NCRP/IAEA/UAQ ni QA numerico.',
    'Incluir export SVG/PNG/PDF/Evidence en el flujo de operacion predeploy.',
  ],
  releaseGate: {
    readyForControlledDeploy: true,
    requiresPostDeploySmoke: true,
    requiresFinalPublicUrl: true,
  },
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  mdPath,
  [
    '# F165 - Cierre De Salidas Clinicas',
    '',
    `Generado: ${manifest.generatedAt}`,
    `Estado: ${manifest.status}`,
    '',
    '## Pendientes Cerrados',
    '',
    ...closedPendings.map((item) => `- ${item.id}: ${item.status}. ${item.evidence}`),
    '',
    '## Gate De Release',
    '',
    `- Deploy controlado: ${manifest.releaseGate.readyForControlledDeploy ? 'si' : 'no'}`,
    `- Repetir smoke post-deploy: ${manifest.releaseGate.requiresPostDeploySmoke ? 'si' : 'no'}`,
    `- URL publica final requerida: ${manifest.releaseGate.requiresFinalPublicUrl ? 'si' : 'no'}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F165 clinical outputs closure written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
