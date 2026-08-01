import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'radshield-mx.f426-f430.calc-renderer-closure.v1'],
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'F426SurfaceRoleCalculation'],
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'F427PenetrationPenalty'],
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'F428StructuralLoadItem'],
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'F429NormativeQaCase'],
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'F430AutoMemoryStep'],
  ['src/lib/f426ToF430CalcRendererClosure.ts', 'rendererDeepPlan'],
  ['src/sections/CanvasArea.tsx', 'buildF426ToF430CalcRendererClosure'],
  ['src/sections/CanvasArea.tsx', 'f426-f430-calc-renderer-closure'],
  ['src/sections/CanvasArea.tsx', 'f426-surface-role-calculation'],
  ['src/sections/CanvasArea.tsx', 'f427-penetration-penalties'],
  ['src/sections/CanvasArea.tsx', 'f428-structural-loads'],
  ['src/sections/CanvasArea.tsx', 'f429-normative-qa-cases'],
  ['src/sections/CanvasArea.tsx', 'f430-auto-memory-flow'],
  ['src/sections/CanvasArea.tsx', 'f426-f430-renderer-deep-plan'],
  ['CHANGELOG.md', 'F426-F430'],
  ['MANUAL_VERSIONES_v50.md', 'F426-F430'],
  ['MANUAL_USUARIO_v99.md', 'F426-F430'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F426-F430 Calc/Renderer closure'],
  ['package.json', 'prepare:f426-f430:calc-renderer'],
  ['package.json', 'test:f426-f430:calc-renderer'],
];

const failures = [];

for (const [relativePath, marker] of checks) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

if (failures.length) {
  console.error('F426-F430 calc/renderer closure audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F426-F430 calc/renderer closure audit passed.');
