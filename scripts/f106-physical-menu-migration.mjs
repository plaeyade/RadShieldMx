import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const workflow = ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'];
const migration = {
  phase: 'F106',
  generatedAt: new Date().toISOString(),
  status: 'controlled-migration',
  targetFlow: workflow,
  migratedGroups: [
    {
      id: 'design',
      label: 'Diseno',
      physicalState: 'canonical-dropdown',
      legacyFallback: 'hidden',
      removalAllowed: false,
      evidenceRequired: ['runtime submenu smoke', 'dialog open evidence', 'visual screenshot', 'rollback path verified'],
    },
    {
      id: 'equipment',
      label: 'Equipos',
      physicalState: 'canonical-dropdown',
      legacyFallback: 'labeled-rollback',
      removalAllowed: false,
      evidenceRequired: ['runtime submenu smoke', 'dialog open evidence', 'visual screenshot', 'rollback path verified'],
    },
    ...workflow.slice(2).map((label) => ({
      id: label.toLowerCase(),
      label,
      physicalState: 'pending',
      legacyFallback: 'unchanged',
      removalAllowed: false,
      evidenceRequired: ['F106 follow-up smoke', 'dialog open evidence', 'visual screenshot'],
    })),
  ],
  fallbackPolicy: 'Design is canonical in the workflow dropdown; Equipment is canonical with explicit rollback labels in legacy menus. No mass legacy deletion before visual/runtime evidence.',
  hiddenLegacyGroups: ['Diseno legacy dropdown'],
  labeledRollbackItems: [
    'Gamma Knife fallback',
    'Braquiterapia Co-60 fallback',
    'CBCT/IGRT fallback',
    'Medicina Nuclear fallback',
    'Equipment Library rollback F106',
    'Equipment Manager rollback F106',
  ],
  physicalRemovalNow: false,
  nextGroups: ['Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
  unresolvedRuntimeWarnings: [
    'backend CSP/fetch warnings in preview until API origin is configured',
    'duplicate React key Rb-82 in radionuclide lists',
  ],
  decision: 'Proceed with one-group-at-a-time physical migration. F106 marks Design and Equipment as canonical while preserving labeled rollback paths.',
};

const jsonPath = join(outputsDir, 'f106_physical_menu_migration.json');
const mdPath = join(outputsDir, 'fase_106_physical_menu_migration.md');

const md = [
  '# F106 - Migracion fisica controlada de menus',
  '',
  '## Resultado',
  '',
  '- Estado: controlled-migration.',
  '- Flujo objetivo: Diseno -> Equipos -> Blindaje -> Verificacion -> Reportes -> Evidencia -> Integraciones.',
  '- Diseno queda como dropdown canonico y el menu legacy se mantiene oculto por filtro.',
  '- Equipos queda como dropdown canonico y los duplicados legacy quedan rotulados como fallback/rollback F106.',
  '- Eliminacion fisica masiva: no.',
  '',
  '## Rollback conservado',
  '',
  ...migration.labeledRollbackItems.map((item) => `- ${item}.`),
  '',
  '## Advertencias que siguen',
  '',
  ...migration.unresolvedRuntimeWarnings.map((item) => `- ${item}.`),
  '',
  '## Siguiente etapa',
  '',
  'Mover Blindaje como siguiente grupo solo despues de smoke visual/runtime y manteniendo rollback por grupo.',
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(migration, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: migration.status, nextGroups: migration.nextGroups }, null, 2));
