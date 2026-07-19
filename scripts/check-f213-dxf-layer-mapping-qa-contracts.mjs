import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f213DxfLayerMappingQa.ts',
  'src/sections/dialogs/DXFViewerDialog.tsx',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f213-dxf-layer-mapping-qa-contracts.mjs',
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
  'F213',
  'buildF213DxfLayerMappingQa',
  'dxf-layer-mapping-ready',
  'f213-dxf-layer-mapping-qa',
  'f213-dxf-barrier-layer-count',
  'f213-dxf-equipment-layer-count',
  'f213-dxf-zone-layer-count',
  'f213-dxf-unmapped-layer-count',
  'f213-dxf-layer-row',
  'test:f213:dxf-layer-mapping',
  'DXF Layer Mapping QA',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const role of ['barrier', 'equipment', 'zone', 'dimension', 'reference', 'text', 'unmapped']) {
  if (!joined.includes(role)) failures.push(`Missing DXF role: ${role}`);
}

for (const tooltip of [
  'Calibrar escala con una distancia conocida',
  'Ejecutar calculo analitico de blindaje',
  'Mapa de calor de dosis con leyenda regulatoria F212',
  'Aplicar LINE/LWPOLYLINE clasificadas como barreras',
]) {
  if (!joined.includes(tooltip)) failures.push(`Missing tooltip text: ${tooltip}`);
}

if (failures.length) {
  console.error('F213 DXF layer mapping QA contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F213 DXF layer mapping QA contracts OK.');
