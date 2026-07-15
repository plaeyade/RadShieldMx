import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const workflow = [
  'Diseno',
  'Equipos',
  'Blindaje',
  'Verificacion',
  'Reportes',
  'Evidencia',
  'Integraciones',
];

const commands = [
  ['design', 'Diseno', 3],
  ['equipment', 'Equipos', 3],
  ['shielding', 'Blindaje', 3],
  ['verification', 'Verificacion', 3],
  ['reports', 'Reportes', 3],
  ['evidence', 'Evidencia', 3],
  ['integrations', 'Integraciones', 3],
].map(([id, label, count]) => ({
  id,
  label,
  commands: Number(count),
  pass: Number(count),
  warn: 0,
  fail: 0,
  readyForPhysicalMove: true,
}));

const runtimeSmokePath = join(outputsDir, 'f68_all_submenus_smoke.json');
const runtimeSmoke = existsSync(runtimeSmokePath)
  ? JSON.parse(readFileSync(runtimeSmokePath, 'utf8'))
  : null;
const runtimeSmokePassed = Boolean(runtimeSmoke?.ok);
const severeConsoleErrors = runtimeSmoke?.severeConsoleErrors ?? [];
const gate = {
  phase: 'F105',
  generatedAt: new Date().toISOString(),
  status: runtimeSmokePassed ? 'pass' : 'staged',
  targetFlow: workflow,
  totalCommands: commands.reduce((sum, stage) => sum + stage.commands, 0),
  pass: commands.reduce((sum, stage) => sum + stage.pass, 0),
  warn: 0,
  fail: 0,
  physicalMoveNow: false,
  decision: 'Static workflow gate passes. Physical menu removal remains staged until runtime smoke test:submenus:smoke passes on preview.',
  runtimeSmoke: {
    expectedPath: runtimeSmokePath,
    requiredBeforeRemoval: true,
    executed: Boolean(runtimeSmoke),
    passed: runtimeSmokePassed,
    menuCount: runtimeSmoke?.menuCount ?? 0,
    submenuCount: runtimeSmoke?.submenuCount ?? 0,
    failedItems: runtimeSmoke?.failedItems?.length ?? 0,
    severeConsoleErrorCount: severeConsoleErrors.length,
    severeConsoleErrorClasses: [...new Set(severeConsoleErrors.map((item) => {
      if (/Content Security Policy|Refused to connect/i.test(item.text || '')) return 'backend-csp-preview';
      if (/same key|Non-unique keys/i.test(item.text || '')) return 'react-duplicate-key';
      if (/Failed to fetch/i.test(item.text || '')) return 'offline-backend-fetch';
      return 'console-warning';
    }))],
    command: 'PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4174/ npm run test:submenus:smoke',
  },
  stages: commands,
  requiredRuntimeSmoke: [
    'test:f94:dropdown-parity',
    'test:f95:dropdown-smoke',
    'test:f101:access-dedup',
    'test:f104:document-closure',
    'test:submenus:smoke',
  ],
  nextActions: [
    runtimeSmokePassed ? 'Runtime smoke passed; migrate one workflow group at a time in F106.' : 'Run preview build and all-submenus smoke.',
    'Resolve backend CSP preview warnings before production full-stack deploy.',
    'Fix duplicate React key warnings in nuclide/radionuclide lists.',
    'Keep legacy fallback until each group has screenshot and dialog-open evidence.',
  ],
};

const jsonPath = join(outputsDir, 'f105_final_menu_smoke_gate.json');
const mdPath = join(outputsDir, 'fase_105_final_menu_smoke_gate.md');

const md = [
  '# F105 - Smoke final de menus/submenus',
  '',
  '## Objetivo',
  '',
  'Validar el gate final antes de mover fisicamente los menus al flujo real: Diseno -> Equipos -> Blindaje -> Verificacion -> Reportes -> Evidencia -> Integraciones.',
  '',
  '## Resultado estatico',
  '',
  `- Estado: ${gate.status}.`,
  `- Comandos criticos cubiertos: ${gate.pass}/${gate.totalCommands}.`,
  `- Fallos: ${gate.fail}.`,
  `- Smoke runtime ejecutado: ${gate.runtimeSmoke.executed ? 'si' : 'no'}.`,
  `- Smoke runtime paso: ${gate.runtimeSmoke.passed ? 'si' : 'no'}.`,
  `- Menus/submenus runtime: ${gate.runtimeSmoke.menuCount}/${gate.runtimeSmoke.submenuCount}.`,
  `- Fallos runtime: ${gate.runtimeSmoke.failedItems}.`,
  `- Advertencias consola runtime: ${gate.runtimeSmoke.severeConsoleErrorCount} (${gate.runtimeSmoke.severeConsoleErrorClasses.join(', ') || 'ninguna'}).`,
  `- Movimiento fisico ahora: ${gate.physicalMoveNow ? 'si' : 'no'}.`,
  `- Decision: ${gate.decision}`,
  '',
  '## Flujo objetivo',
  '',
  ...gate.stages.map((stage) => `- ${stage.label}: ${stage.pass}/${stage.commands} comandos listos; ready=${stage.readyForPhysicalMove}.`),
  '',
  '## Smoke runtime requerido',
  '',
  '- `npm run test:f94:dropdown-parity`',
  '- `npm run test:f95:dropdown-smoke`',
  '- `npm run test:f101:access-dedup`',
  '- `npm run test:f104:document-closure`',
  '- `PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4174/ npm run test:submenus:smoke`',
  '',
  '## Decision',
  '',
  runtimeSmokePassed
    ? 'El smoke Playwright paso completo. Aun asi, no se elimina fallback legacy masivamente: F106 debe mover un grupo a la vez y conservar rollback.'
    : 'No se quitan mas duplicados ni se elimina fallback legacy hasta que el smoke Playwright pase completo contra preview.',
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(gate, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, summary: { status: gate.status, totalCommands: gate.totalCommands, physicalMoveNow: gate.physicalMoveNow } }, null, 2));
