import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const migration = {
  phase: 'F109',
  generatedAt: new Date().toISOString(),
  status: 'controlled-migration',
  targetFlow: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  canonicalCommands: [
    'Memoria IA',
    'PDF analitico',
    'Reporte CNSNS',
    'Dashboard de reportes',
    'Costo / presupuesto',
    'Checklist CNSNS',
    'Reporte anual de dosis',
    'Evidence Pack bridge',
  ],
  labeledRollbackItems: [
    'Export PDF fallback F109',
    'Export CNSNS fallback F109',
    'Annual Dose Report fallback F109',
    'Reports dashboard fallback F109',
    'Cost dashboard fallback F109',
    'CNSNS checklist fallback F109',
    'Evidence Pack fallback F109',
  ],
  nextGroups: ['Evidencia', 'Integraciones'],
  physicalRemovalNow: false,
  decision: 'Reports becomes canonical in F109. Legacy export/report entries remain labeled fallback until report generation and evidence smoke pass.',
};

const jsonPath = join(outputsDir, 'f109_reports_menu_migration.json');
const mdPath = join(outputsDir, 'fase_109_reports_menu_migration.md');

const md = [
  '# F109 - Reportes canonicos',
  '',
  '## Resultado',
  '',
  '- Reportes queda como quinto dropdown canonico.',
  '- Se agrupan memoria IA, PDF, CNSNS, dashboards, costos, checklist y reporte anual.',
  '- Las rutas anteriores quedan como fallback F109.',
  '- Eliminacion fisica masiva: no.',
  '',
  '## Comandos canonicos',
  '',
  ...migration.canonicalCommands.map((item) => `- ${item}.`),
  '',
  '## Siguiente etapa',
  '',
  'F110 debe migrar Evidencia: Evidence Pack, RAG, bibliografia, auditoria y trazabilidad documental.',
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(migration, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: migration.status }, null, 2));
