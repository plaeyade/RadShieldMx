import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'lib', 'f149NormativeNumericQa.ts');
const outDir = path.join(root, 'outputs', 'f149_normative_numeric_qa');
const jsonPath = path.join(outDir, 'f149_normative_numeric_qa.json');
const mdPath = path.join(root, 'outputs', 'fase_149_normative_numeric_qa.md');

const source = fs.readFileSync(sourcePath, 'utf8');
const caseIds = [...source.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
const familyNames = ['NCRP147', 'NCRP151', 'AAPM_TG108', 'IAEA_SRS47', 'UAQ_PROTOCOL'];

const manifest = {
  phase: 'F149',
  title: 'QA numerico normativo NCRP/IAEA/UAQ',
  generatedAt: new Date().toISOString(),
  source: path.relative(root, sourcePath).replaceAll(path.sep, '/'),
  uiIntegrations: [
    'src/sections/dialogs/MemoriaAIWizard.tsx',
    'src/sections/dialogs/EvidencePackDialog.tsx',
    'src/sections/dialogs/UpdateAppDialog.tsx',
  ],
  caseIds,
  caseCount: caseIds.length,
  families: familyNames,
  evidenceStrengths: ['canonical-reference', 'engine-cross-check', 'protocol-internal'],
  releasePolicy: [
    'canonical-reference failures block F150',
    'engine-cross-check failures block F150',
    'protocol-internal cases require professional review',
    'Memoria IA exports formula, standard, inputs, outputs, citation and QA status',
  ],
  nextPhase: 'F149b smoke Memoria IA/PDF/Evidence export, then F150 release candidate',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(mdPath, [
  '# F149 - QA numerico normativo',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  '## Alcance',
  '',
  'F149 agrega una compuerta numerica para separar referencias canonicas, cross-checks del motor y casos internos de protocolo antes de F150.',
  '',
  '## Casos',
  '',
  ...caseIds.map((id) => `- ${id}`),
  '',
  '## Politica release',
  '',
  ...manifest.releasePolicy.map((item) => `- ${item}`),
  '',
  `Siguiente fase: ${manifest.nextPhase}`,
  '',
].join('\n'));

console.log(`F149 manifest written: ${path.relative(root, jsonPath)}`);
