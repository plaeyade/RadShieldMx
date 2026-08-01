import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f436ToF438RendererV2Bridge.ts'), 'utf8');

const markers = [
  'Desktop BIM canvas',
  'Tablet/mobile guarded',
  'Roles de superficie',
  'Anexo de penetraciones',
  'Carga estructural',
  'Baseline visual',
  'Barrier geometry core',
  'Source geometry core',
  'Region geometry core',
  'Penetration geometry core',
  'Evidence overlay core',
  'VITE_CANVAS_HIGH_RISK_CAD',
  'VITE_CANVAS_EVENT_CONTROLLER_V2',
  'eventControllerEnabled: false',
  'Fallback to CanvasArea/useCanvas renderer path',
];

const failures = markers.filter((marker) => !text.includes(marker));
const baselineCount = (text.match(/requiredSurfaces:/g) ?? []).length;
const linkCount = (text.match(/payloadFields:/g) ?? []).length;
const geometryCount = (text.match(/rendererLayer:/g) ?? []).length;

if (baselineCount < 2) failures.push(`expected at least 2 visual baselines, found ${baselineCount}`);
if (linkCount < 4) failures.push(`expected at least 4 PDF/Evidence links, found ${linkCount}`);
if (geometryCount < 5) failures.push(`expected at least 5 geometry core entities, found ${geometryCount}`);

if (failures.length) {
  console.error('F436-F438 renderer v2 bridge contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F436-F438 renderer v2 bridge contracts passed.');
