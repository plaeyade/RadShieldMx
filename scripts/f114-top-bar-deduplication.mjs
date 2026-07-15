import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const implementation = {
  phase: 'F114',
  generatedAt: new Date().toISOString(),
  status: 'implemented-controlled',
  canonicalMenus: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  visibleLegacyMenus: ['Archivo', 'Eficiencia'],
  hiddenDuplicateMenus: ['Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Reportes legacy', 'Herramientas'],
  preservedFallbackPolicy: 'Definitions and handlers stay in Toolbar code; only duplicate top-bar triggers are filtered from rendering.',
  nextPhase: 'F115 visual/menu smoke validates canonical dropdowns, active modality profiles, Archivo and Eficiencia.',
  decision: 'F114 reduces top-bar duplication without deleting handlers. Archivo remains for project I/O. Eficiencia remains for performance/audit tools until F115 decides final relocation.',
};

const jsonPath = join(outputsDir, 'f114_top_bar_deduplication.json');
const mdPath = join(outputsDir, 'fase_114_top_bar_deduplication.md');

const md = [
  '# F114 - Deduplicacion de barra superior',
  '',
  '## Resultado',
  '',
  '- Se mantienen visibles los menus canonicos del flujo real.',
  '- Se ocultan triggers legacy duplicados de la barra superior.',
  '- Archivo y Eficiencia permanecen visibles por contener operaciones aun no absorbidas completamente.',
  '- Los handlers legacy no se eliminan en esta fase.',
  '',
  '## Canonicos',
  '',
  ...implementation.canonicalMenus.map((item) => `- ${item}.`),
  '',
  '## Legacy visible',
  '',
  ...implementation.visibleLegacyMenus.map((item) => `- ${item}.`),
  '',
  '## Duplicados ocultos',
  '',
  ...implementation.hiddenDuplicateMenus.map((item) => `- ${item}.`),
  '',
  '## Siguiente',
  '',
  implementation.nextPhase,
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(implementation, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: implementation.status }, null, 2));
