import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f439ToF441RendererGeometryCore.ts'), 'utf8');

const markers = [
  'barrierEntity',
  'sourceEntity',
  'regionEntity',
  'evidenceOverlayEntity',
  'Barreras por rol',
  'Equipos/fuentes',
  'Zonas y ocupacion',
  'Penetraciones MEP',
  'Estado evidencia',
  'Entidades normalizadas',
  'Overlay plan por capas',
  'Puente F436-F438 disponible',
  'Flag renderer profundo',
  'Eventos legacy intactos',
  'Geometry core listo como capa observable',
];

const failures = markers.filter((marker) => !text.includes(marker));
const entityMappers = (text.match(/function .*Entity/g) ?? []).length;
const overlayCount = (text.match(/overlayPlan\('/g) ?? []).length;
const preflightCount = (text.match(/id: '/g) ?? []).filter(Boolean).length;

if (entityMappers < 4) failures.push(`expected at least 4 entity mappers, found ${entityMappers}`);
if (overlayCount < 5) failures.push(`expected at least 5 overlay plans, found ${overlayCount}`);
if (preflightCount < 5) failures.push(`expected at least 5 preflight checks, found ${preflightCount}`);

if (failures.length) {
  console.error('F439-F441 renderer geometry core contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F439-F441 renderer geometry core contracts passed.');
