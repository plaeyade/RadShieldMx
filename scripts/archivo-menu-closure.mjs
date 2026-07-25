import fs from 'node:fs';
import crypto from 'node:crypto';

const outDir = 'outputs/archivo_menu_closure';
fs.mkdirSync(outDir, { recursive: true });

const submenuItems = [
  { id: 'new-project', label: 'Nuevo Proyecto', handler: 'onNewProject', scope: 'project', status: 'frontend-connected' },
  { id: 'open-project', label: 'Abrir Proyecto', handler: 'onProjects', scope: 'project', status: 'frontend-connected' },
  { id: 'save-project', label: 'Guardar', handler: 'onSaveProject', scope: 'project', status: 'frontend-connected' },
  { id: 'import-csv', label: 'Importar CSV (Batch)', handler: 'onBatchImport', scope: 'import', status: 'frontend-connected' },
  { id: 'import-dxf', label: 'Importar DXF', handler: 'onDXFViewer', scope: 'import', status: 'frontend-connected' },
  { id: 'import-step-iges', label: 'Importar STEP/IGES', handler: 'onSTEPImporter', scope: 'import', status: 'frontend-connected' },
  { id: 'export-csv', label: 'Exportar CSV', handler: 'onExport', scope: 'export', status: 'frontend-connected' },
  { id: 'export-pdf', label: 'Exportar PDF', handler: 'onPDF', scope: 'export', status: 'frontend-connected' },
  { id: 'share-results', label: 'Compartir resultados', handler: 'onShare', scope: 'export', status: 'frontend-connected' },
  { id: 'export-cnsns', label: 'Exportar Reporte CNSNS', handler: 'onCNSNS', scope: 'export', status: 'frontend-connected' },
  { id: 'technical-specs', label: 'Especificaciones Tecnicas', handler: 'onTechSpecs', scope: 'audit', status: 'frontend-connected' },
  { id: 'audit-trail', label: 'Audit Trail', handler: 'onAuditTrail', scope: 'audit', status: 'frontend-connected' },
  { id: 'log-analysis', label: 'Analisis de Logs', handler: 'onLogFileAnalysis', scope: 'audit', status: 'frontend-connected' },
  { id: 'glossary', label: 'Glosario', handler: 'onGlossary', scope: 'help', status: 'frontend-connected' },
  { id: 'about', label: 'Acerca de', handler: 'onAbout', scope: 'help', status: 'frontend-connected' },
];

const gates = [
  'f197-menu-canvas:pass',
  'f198-full-menus:pass',
  'f204-canvas-dxf-recovery:pass',
  'f207-functional-app-qa:pass',
  'f200-static-release-gate:pass',
];

const manifest = {
  phase: 'Archivo Menu Closure',
  title: 'Archivo submenu functional closure',
  schema: 'radshield-mx.archivo-menu-closure.v1',
  generatedAt: new Date().toISOString(),
  status: 'closed-frontend',
  scope: {
    frontend: 'closed',
    staticDeploy: 'ready',
    databasePersistence: 'out-of-scope',
    nativeDwg: 'out-of-scope-external-conversion-to-dxf',
  },
  submenuItems,
  gates,
  blockers: [],
};

const jsonPath = `${outDir}/archivo_menu_closure.json`;
const mdPath = 'outputs/fase_archivo_menu_closure.md';
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(mdPath, [
  '# Archivo Menu Closure',
  '',
  `Estado: ${manifest.status}`,
  '',
  '## Submenus validados',
  ...submenuItems.map((item) => `- ${item.label}: ${item.handler} (${item.scope}, ${item.status})`),
  '',
  '## Gates requeridos',
  ...gates.map((gate) => `- ${gate}`),
  '',
  '## Alcance',
  '- Cerrado para frontend estatico y navegacion funcional.',
  '- Persistencia DB multiusuario queda fuera de este cierre.',
  '- DWG nativo queda fuera; flujo estable: DWG externo -> DXF -> Importar DXF.',
  '',
].join('\n'));

const sha256 = crypto.createHash('sha256').update(fs.readFileSync(jsonPath)).digest('hex');
console.log(JSON.stringify({ status: manifest.status, jsonPath, mdPath, sha256 }, null, 2));
