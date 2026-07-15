import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const plan = {
  phase: 'F116',
  generatedAt: new Date().toISOString(),
  status: 'implemented-controlled',
  visibleLegacyMenus: ['Archivo'],
  movedToIntegrations: [
    'Performance Dashboard',
    'Benchmarks Suite',
    'Function Profiler',
    'CPU & Memory Profile',
    'Technical Audit',
    'Code Quality Audit',
    'Algorithm Analyzer',
    'CAD/MC Geometry',
    'Shielding Design Agent',
    'Performance Recommendations',
    'WASM Optimizations',
    'Continuous Tests',
  ],
  canonicalIntegrationsTrigger: 'f116-migrated-integrations-dropdown',
  deletedHandlers: [],
  nextPhase: 'F117 should connect active modality profiles with Memoria IA defaults, report templates and Evidence Pack routing.',
  decision: 'F116 keeps Archivo as the only top-bar utility menu and moves Eficiencia into canonical Integraciones without deleting legacy handlers.',
};

const jsonPath = join(outputsDir, 'f116_utility_menu_consolidation.json');
const mdPath = join(outputsDir, 'fase_116_utility_menu_consolidation.md');

const md = [
  '# F116 - Consolidacion de utilidades',
  '',
  '## Decision',
  '',
  plan.decision,
  '',
  '## Legacy visible',
  '',
  ...plan.visibleLegacyMenus.map((item) => `- ${item}.`),
  '',
  '## Movido a Integraciones',
  '',
  ...plan.movedToIntegrations.map((item) => `- ${item}.`),
  '',
  '## Garantias',
  '',
  '- No se borran handlers legacy.',
  '- Eficiencia deja de renderizarse como menu superior independiente.',
  '- Integraciones queda como destino canonico para performance, auditoria, CAD/MC y agentes.',
  '',
  '## Siguiente',
  '',
  plan.nextPhase,
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: plan.status }, null, 2));
