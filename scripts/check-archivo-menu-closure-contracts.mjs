import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const toolbar = read('src/sections/Toolbar.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const manifest = JSON.parse(read('outputs/archivo_menu_closure/archivo_menu_closure.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

const items = [
  ['Nuevo Proyecto', 'onNewProject'],
  ['Abrir Proyecto', 'onProjects'],
  ['Guardar', 'onSaveProject'],
  ['Importar CSV', 'onBatchImport'],
  ['Importar DXF', 'onDXFViewer'],
  ['Importar STEP', 'onSTEPImporter'],
  ['Exportar CSV', 'onExport'],
  ['Exportar PDF', 'onPDF'],
  ['Compartir resultados', 'onShare'],
  ['Exportar Reporte CNSNS', 'onCNSNS'],
  ['Especificaciones', 'onTechSpecs'],
  ['Audit Trail', 'onAuditTrail'],
  ['Analisis de Logs', 'onLogFileAnalysis'],
  ['Glosario', 'onGlossary'],
  ['Acerca de', 'onAbout'],
];

for (const [label, handler] of items) {
  expect(`manifest includes ${label}`, manifest.submenuItems.some((item) => item.label.includes(label) && item.handler === handler));
  expect(`Toolbar wires ${handler}`, toolbar.includes(`onClick={${handler}}`));
  expect(`ShieldingDesigner passes ${handler}`, designer.includes(`${handler}={`));
}

expect('Archivo labels no longer expose fallback migration labels', !toolbar.includes('Exportar PDF (fallback') && !toolbar.includes('label={`${t(\'file.techSpecs\')} (fallback F110)`'));
expect('Update Center marks Archivo current', update.includes("{ name: 'Archivo', current: 'closed'") && update.includes('Archivo Menu Closure'));
expect('Changelog documents Archivo Menu Closure', changelog.includes('Archivo Menu Closure'));
expect('Manual versions documents Archivo Menu Closure', versions.includes('Archivo Menu Closure'));
expect('User manual documents Archivo Menu Closure', manual.includes('Archivo Menu Closure'));
expect('Manifest status closed frontend', manifest.status === 'closed-frontend');
expect('Manifest keeps DB out of scope', manifest.scope.databasePersistence === 'out-of-scope');
expect('Manifest keeps DWG external', manifest.scope.nativeDwg === 'out-of-scope-external-conversion-to-dxf');
expect('F200 gate included', manifest.gates.includes('f200-static-release-gate:pass'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`Archivo menu closure contracts failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('Archivo menu closure contracts passed.');
