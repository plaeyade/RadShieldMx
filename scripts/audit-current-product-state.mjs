import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'outputs', 'current_product_state_audit');
mkdirSync(outDir, { recursive: true });

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function uniq(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function extractStringList(text, startToken) {
  const start = text.indexOf(startToken);
  if (start < 0) return [];
  const tail = text.slice(start);
  const end = tail.search(/\]\s*(?:as const|;|\))/);
  const block = end >= 0 ? tail.slice(0, end) : tail.slice(0, 20000);
  return uniq(Array.from(block.matchAll(/['"]([A-Za-z0-9_-]+)['"]/g)).map((match) => match[1]));
}

function extractRegex(text, regex) {
  return uniq(Array.from(text.matchAll(regex)).map((match) => match[1]));
}

function countNeedles(text, needles) {
  return needles.reduce((sum, needle) => sum + (text.match(new RegExp(needle, 'gi')) ?? []).length, 0);
}

const appStore = read('src/stores/appStore.ts');
const dialogRegistry = read('src/stores/dialogRegistry.ts');
const shieldingDesigner = read('src/pages/ShieldingDesigner.tsx');
const toolbar = read('src/sections/Toolbar.tsx');
const sidebar = existsSync(join(root, 'src/sections/Sidebar.tsx')) ? read('src/sections/Sidebar.tsx') : '';
const canvas = read('src/sections/CanvasArea.tsx');
const updateCenter = read('src/sections/dialogs/UpdateAppDialog.tsx');
const dialogHost = read('src/components/DialogHost.tsx');

const appStoreDialogs = extractStringList(appStore, 'const DIALOG_NAMES');
const registryDialogs = extractStringList(dialogRegistry, 'const DIALOG_NAMES');
const lazyDialogs = uniq([
  ...extractRegex(shieldingDesigner, /<LazyDialog\s+name=["']([^"']+)["']/g),
  ...extractRegex(dialogHost, /<LazyDialog\s+name=["']([^"']+)["']/g),
]);
const directlyRenderedDialogs = [
  shieldingDesigner.includes('<CommandPalette ') || dialogHost.includes('<CommandPalette ') ? 'commandPalette' : null,
  shieldingDesigner.includes('<OnboardingTour ') || dialogHost.includes('<OnboardingTour ') ? 'onboardingTour' : null,
].filter(Boolean);
const renderedDialogs = uniq([...lazyDialogs, ...directlyRenderedDialogs]);
const openedDialogs = uniq([
  ...extractRegex(shieldingDesigner, /\.open\(["']([^"']+)["']\)/g),
  ...extractRegex(toolbar, /\.open\(["']([^"']+)["']\)/g),
  ...extractRegex(sidebar, /\.open\(["']([^"']+)["']\)/g),
  ...extractRegex(canvas, /\.open\(["']([^"']+)["']\)/g),
]);

const e2eFiles = readdirSync(join(root, 'e2e')).filter((name) => name.endsWith('.spec.ts')).sort();
const canvasE2eFiles = e2eFiles.filter((name) => /canvas|renderer|f\d{3}|menu-archivo|radshield/i.test(name));
const packageJson = JSON.parse(read('package.json'));
const scripts = Object.keys(packageJson.scripts ?? {});

const coreSurfaces = [
  {
    id: 'canvas',
    label: 'Canvas/floorplan',
    codeFiles: ['src/sections/CanvasArea.tsx', 'src/hooks/useCanvas.ts'],
    e2e: canvasE2eFiles.filter((name) => /canvas|renderer|f\d{3}|radshield/i.test(name)),
    gatedTerms: countNeedles(canvas, ['preview', 'gated', 'blocked', 'pendiente']),
    risk: 'high',
    usefulNext: 'Reducir paneles QA visibles y probar acciones reales: seleccionar, mover, borrar, zoom, importar, exportar.',
  },
  {
    id: 'menus',
    label: 'Menus y accesos',
    codeFiles: ['src/sections/Toolbar.tsx', 'src/pages/ShieldingDesigner.tsx'],
    e2e: e2eFiles.filter((name) => /menu|archivo|f404|f374/i.test(name)),
    gatedTerms: countNeedles(toolbar + shieldingDesigner, ['preview', 'gated', 'blocked', 'pendiente']),
    risk: 'high',
    usefulNext: 'Verificar que cada item visible abra un dialogo registrado y con LazyDialog real.',
  },
  {
    id: 'calculation',
    label: 'Motor de calculo',
    codeFiles: ['src/lib/shieldingMath.ts', 'src/hooks/useShieldingEngine.ts'],
    e2e: e2eFiles.filter((name) => /nuclear|evidence|radshield/i.test(name)),
    gatedTerms: countNeedles(read('src/lib/f484F490NormativeQa.ts') + read('src/lib/f581F585ExpandedNormativeNumericQa.ts'), ['preliminar', 'pending', 'blocked', 'gated']),
    risk: 'high',
    usefulNext: 'Cerrar casos numericos firmes y warnings clinicos antes de seguir visuales.',
  },
  {
    id: 'medical3d',
    label: '3D/fotorrealismo',
    codeFiles: ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'src/lib/medical3D'],
    e2e: e2eFiles.filter((name) => /medical-3d|babylon|unity|photoreal|visual-stack/i.test(name)),
    gatedTerms: countNeedles(read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx'), ['preview', 'gated', 'blocked', 'pendiente']),
    risk: 'medium',
    usefulNext: 'Mantener Three/R3F estable; no hacer Unity/Babylon principal hasta tener assets/build reales.',
  },
  {
    id: 'documentation',
    label: 'Documentacion/Update',
    codeFiles: ['public/manual_usuario.html', 'public/manual_versiones.html', 'src/sections/dialogs/UpdateAppDialog.tsx'],
    e2e: e2eFiles.filter((name) => /static|f134|f511|f591/i.test(name)),
    gatedTerms: countNeedles(updateCenter + read('public/manual_usuario.html'), ['preview', 'gated', 'blocked', 'pendiente']),
    risk: 'medium',
    usefulNext: 'Cambiar de historial por fases a matriz de estado: funcional, preview, gated, roto.',
  },
];

const missingInRegistry = appStoreDialogs.filter((name) => !registryDialogs.includes(name));
const registryOnly = registryDialogs.filter((name) => !appStoreDialogs.includes(name));
const openedNotInAppStore = openedDialogs.filter((name) => !appStoreDialogs.includes(name));
const openedWithoutLazyDialog = openedDialogs.filter((name) => !renderedDialogs.includes(name));
const lazyNotOpened = renderedDialogs.filter((name) => !openedDialogs.includes(name));

const audit = {
  schema: 'radshield-mx.product-state-audit.v1',
  generatedAt: new Date().toISOString(),
  git: {
    head: readFileSync(join(root, '.git', 'HEAD'), 'utf8').trim(),
  },
  dialogs: {
    appStoreCount: appStoreDialogs.length,
    registryCount: registryDialogs.length,
    lazyDialogCount: lazyDialogs.length,
    renderedDialogCount: renderedDialogs.length,
    openedDialogCount: openedDialogs.length,
    missingInRegistry,
    registryOnly,
    openedNotInAppStore,
    openedWithoutLazyDialog: openedWithoutLazyDialog.slice(0, 80),
    openedWithoutLazyDialogCount: openedWithoutLazyDialog.length,
    lazyNotOpened: lazyNotOpened.slice(0, 40),
    lazyNotOpenedCount: lazyNotOpened.length,
  },
  tests: {
    e2eCount: e2eFiles.length,
    canvasE2eCount: canvasE2eFiles.length,
    scriptsCount: scripts.length,
    usefulScripts: scripts.filter((name) => /test:f\d|test:smoke|build|preview/.test(name)).length,
  },
  surfaces: coreSurfaces,
  decision: {
    stopPhaseNumbering: true,
    nextObjective: 'Canvas funcional real',
    firstRepairBlock: [
      'Dialog registry parity: appStore, dialogRegistry, LazyDialog y botones visibles.',
      'Canvas action smoke: seleccionar, mover, borrar, zoom, importar/exportar, abrir memoria/evidence.',
      'Eliminar o colapsar paneles QA que obstruyen el layout del plano.',
      'Convertir Update Center de lista de fases a matriz de capacidades funcionales.',
    ],
  },
};

const lines = [
  '# Auditoria Real Del Estado Actual',
  '',
  `Generado: ${audit.generatedAt}`,
  '',
  '## Decision',
  '',
  '- Detener numeracion incremental de fases.',
  '- Siguiente objetivo unico: **Canvas funcional real**.',
  '- No agregar nuevas features hasta que los botones visibles pasen smoke real.',
  '',
  '## Dialogos Y Menus',
  '',
  `- Dialogos en appStore: ${audit.dialogs.appStoreCount}`,
  `- Dialogos en dialogRegistry: ${audit.dialogs.registryCount}`,
  `- LazyDialog renderizados: ${audit.dialogs.lazyDialogCount}`,
  `- Dialogos renderizados totales (Lazy + directos): ${audit.dialogs.renderedDialogCount}`,
  `- Dialogos abiertos por handlers detectados: ${audit.dialogs.openedDialogCount}`,
  `- Registrados en appStore pero faltan en dialogRegistry: ${missingInRegistry.length}`,
  `- Abiertos pero sin LazyDialog detectado: ${openedWithoutLazyDialog.length}`,
  '',
  '### Top Abiertos Sin LazyDialog Detectado',
  '',
  ...(openedWithoutLazyDialog.slice(0, 30).map((name) => `- ${name}`)),
  '',
  '## Superficies Principales',
  '',
  '| Superficie | Riesgo | E2E relacionados | Terminos gated/preview | Siguiente paso |',
  '|---|---:|---:|---:|---|',
  ...coreSurfaces.map((surface) => `| ${surface.label} | ${surface.risk} | ${surface.e2e.length} | ${surface.gatedTerms} | ${surface.usefulNext} |`),
  '',
  '## Primer Bloque De Reparacion',
  '',
  ...audit.decision.firstRepairBlock.map((item) => `- ${item}`),
  '',
  '## Archivos De Evidencia',
  '',
  '- `outputs/current_product_state_audit/product_state_audit.json`',
  '- `outputs/current_product_state_audit/PRODUCT_STATE_AUDIT.md`',
];

writeFileSync(join(outDir, 'product_state_audit.json'), JSON.stringify(audit, null, 2));
writeFileSync(join(outDir, 'PRODUCT_STATE_AUDIT.md'), `${lines.join('\n')}\n`);

console.log(`Product state audit written to ${join(outDir, 'PRODUCT_STATE_AUDIT.md')}`);
console.log(`Opened without LazyDialog: ${openedWithoutLazyDialog.length}`);
console.log(`Missing in registry: ${missingInRegistry.length}`);
