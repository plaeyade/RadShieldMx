import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const migration = {
  phase: 'F110',
  generatedAt: new Date().toISOString(),
  status: 'controlled-migration',
  targetFlow: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  canonicalCommands: [
    'Evidence Pack',
    'RAG deep dive',
    'Reference Library',
    'Bibliografia',
    'Audit Trail',
    'Audit Log',
    'Log analysis',
    'Technical specs',
    'AI source review',
    'Algorithm / code audit',
  ],
  labeledRollbackItems: [
    'Evidence Pack fallback F110',
    'Bibliografia fallback F110',
    'Audit Trail fallback F110',
    'Audit Log fallback F110',
    'Log analysis fallback F110',
    'AI Assistant fallback F110',
    'Technical Audit fallback F110',
  ],
  ragBoundary: 'RAG ingestion remains offline-safe in F110. The canonical Evidence menu opens review and evidence surfaces now; live DB/vector persistence remains gated by MySQL availability.',
  nextGroups: ['Integraciones'],
  physicalRemovalNow: false,
  decision: 'Evidence becomes canonical in F110. Legacy documentation, audit and AI/RAG entries remain labeled fallback until Evidence Pack, bibliography, RAG and audit smoke pass.',
};

const jsonPath = join(outputsDir, 'f110_evidence_menu_migration.json');
const mdPath = join(outputsDir, 'fase_110_evidence_menu_migration.md');

const md = [
  '# F110 - Evidencia canonica',
  '',
  '## Resultado',
  '',
  '- Evidencia queda como sexto dropdown canonico.',
  '- Se agrupan Evidence Pack, RAG deep dive, biblioteca, bibliografia, auditoria, logs, especificaciones tecnicas y revision IA.',
  '- Las rutas anteriores quedan como fallback F110.',
  '- Eliminacion fisica masiva: no.',
  '',
  '## Comandos canonicos',
  '',
  ...migration.canonicalCommands.map((item) => `- ${item}.`),
  '',
  '## Limite RAG/DB',
  '',
  migration.ragBoundary,
  '',
  '## Siguiente etapa',
  '',
  'F111 puede implementar Acceso Rapido de bajo riesgo: favoritos, chips de estado y accesos contextuales sin retirar menus legacy.',
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(migration, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: migration.status }, null, 2));
