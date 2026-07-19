import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f216MiniViewManager.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f216-mini-view-manager-contracts.mjs',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');

for (const token of [
  'F216',
  'buildF216MiniViewManager',
  'mini-view-manager-ready',
  'radshield_canvas_saved_views_f216',
  'f216-mini-view-manager',
  'f216-view-zoom',
  'f216-view-pan',
  'f216-save-view-A',
  'f216-restore-view-A',
  'f216-clear-view-A',
  'test:f216:mini-view-manager',
  'Mini View Manager',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const action of ['Guardar vista actual', 'Restaurar vista', 'Eliminar vista']) {
  if (!joined.includes(action)) failures.push(`Missing view action text: ${action}`);
}

if (failures.length) {
  console.error('F216 mini view manager contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F216 mini view manager contracts OK.');
