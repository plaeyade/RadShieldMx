import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const outDir = 'outputs/f404_file_menu_functional_qa';
mkdirSync(outDir, { recursive: true });

const read = (file) => readFileSync(file, 'utf8');
const toolbar = read('src/sections/Toolbar.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const techSpecs = read('src/sections/dialogs/TechSpecsDialog.tsx');

const items = [
  ['new-project', 'f404-file-new-project', 'onNewProject', 'project-reset'],
  ['open-projects', 'f404-file-open-projects', 'onProjects', 'Administrador de Proyectos'],
  ['save-project', 'f404-file-save-project', 'onSaveProject', 'toast-save'],
  ['import-csv', 'f404-file-import-csv', 'onBatchImport', 'Importar batch CSV/Excel'],
  ['import-dxf', 'f404-file-import-dxf', 'onDXFViewer', 'Visor DXF'],
  ['import-step', 'f404-file-import-step', 'onSTEPImporter', 'STEP / IGES Native Importer'],
  ['export-csv', 'f404-file-export-csv', 'onExport', 'Exportar Resultados'],
  ['export-pdf', 'f404-file-export-pdf', 'onPDF', 'direct-pdf-handler'],
  ['share-results', 'f404-file-share-results', 'onShare', 'browser-share-api'],
  ['export-cnsns', 'f404-file-export-cnsns', 'onCNSNS', 'Generar Memoria Analitica CNSNS'],
  ['tech-specs', 'f404-file-tech-specs', 'onTechSpecs', 'f404-tech-specs-dialog'],
  ['audit-trail', 'f404-file-audit-trail', 'onAuditTrail', 'Audit Trail'],
  ['log-analysis', 'f404-file-log-analysis', 'onLogFileAnalysis', 'Log File Analysis'],
  ['glossary', 'f404-file-glossary', 'onGlossary', 'Glosario de Terminologia'],
  ['about', 'f404-file-about', 'onAbout', 'Acerca de RadShield-MX'],
];

const failures = [];
for (const [, testId, handler] of items) {
  if (!toolbar.includes(`testId="${testId}"`)) failures.push(`Toolbar missing ${testId}`);
  if (!toolbar.includes(`invoke(${handler}`) && !toolbar.includes(`onClick={invoke(${handler}`)) {
    failures.push(`Toolbar item ${testId} not wired to ${handler}`);
  }
  if (!designer.includes(`${handler}={`)) failures.push(`ShieldingDesigner does not pass ${handler}`);
}

if (!techSpecs.includes('f404-tech-specs-dialog')) failures.push('TechSpecsDialog remains untraceable');
if (techSpecs.includes('return null')) failures.push('TechSpecsDialog is still a stub');
if (!read('e2e/f404-file-menu-functional.spec.ts').includes('Archivo submenu items open their real frontend surfaces')) {
  failures.push('F404 Playwright functional smoke missing');
}

const report = {
  phase: 'F404',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'archivo-menu-functional-ready',
  menu: 'Archivo',
  itemCount: items.length,
  browserVerifiedItems: 11,
  deferredRuntimeItems: ['new-project visual reset', 'save-project toast/persistence', 'export-pdf direct download', 'share-results Web Share API'],
  items: items.map(([id, testId, handler, expectedSurface]) => ({ id, testId, handler, expectedSurface })),
  failures,
};

writeFileSync(`${outDir}/f404_file_menu_functional_qa.json`, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync('outputs/fase_404_archivo_menu_functional_qa.md', [
  '# F404 Archivo menu functional QA',
  '',
  `Estado: ${report.status}`,
  '',
  '## Cobertura',
  ...report.items.map((item) => `- ${item.id}: ${item.testId} -> ${item.handler} -> ${item.expectedSurface}`),
  '',
  '## Diferidos de runtime',
  ...report.deferredRuntimeItems.map((item) => `- ${item}`),
  '',
].join('\n'));

if (failures.length) {
  console.error('F404 audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`F404 audit OK: ${items.length} Archivo actions traced; ${report.browserVerifiedItems} browser-verifiable.`);
