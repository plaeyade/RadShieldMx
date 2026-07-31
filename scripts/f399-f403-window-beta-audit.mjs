import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'outputs/f399_f403_window_beta_audit';
mkdirSync(outDir, { recursive: true });

const read = (file) => readFileSync(file, 'utf8');
const hash = (text) => createHash('sha256').update(text).digest('hex');

const fullscreenSurfaces = [
  ['F392', 'Evidence Pack', 'src/sections/dialogs/EvidencePackDialog.tsx', 'f392-evidence-pack-fullscreen-shell'],
  ['F393', 'Manual de Usuario', 'src/sections/dialogs/ManualDialog.tsx', 'f393-manual-fullscreen-shell'],
  ['F394', 'Memoria Analitica', 'src/sections/dialogs/MemoriaAnaliticaWizard.tsx', 'f394-memoria-analitica-fullscreen-shell'],
  ['F395', 'Layout Bunker', 'src/sections/dialogs/LayoutBunkerDialog.tsx', 'f395-layout-bunker-fullscreen-shell'],
  ['F396', 'Dashboard', 'src/sections/dialogs/DashboardDialog.tsx', 'f396-dashboard-fullscreen-shell'],
  ['F397', 'Checklist CNSNS', 'src/sections/dialogs/ChecklistCNSNSDialog.tsx', 'f397-checklist-cnsns-fullscreen-shell'],
  ['F398', 'NCRP 151 Tables', 'src/sections/dialogs/NCRP151TablesDialog.tsx', 'f398-ncrp151-tables-fullscreen-shell'],
];

const dialogShellSurfaces = [
  ['F389', 'Compare Scenarios', 'src/sections/dialogs/CompareScenariosDialog.tsx', 'f389-compare-scenarios-dialogshell'],
  ['F390', 'Tutorial', 'src/sections/dialogs/TutorialDialog.tsx', 'f390-tutorial-dialogshell'],
  ['F391', 'Version History', 'src/sections/dialogs/VersionHistoryDialog.tsx', 'f391-version-history-dialogshell'],
];

const complexScreens = [
  ['Evidence Pack', 'src/sections/dialogs/EvidencePackDialog.tsx', 'Cerrar Evidence Pack'],
  ['Manual de Usuario', 'src/sections/dialogs/ManualDialog.tsx', 'Cerrar Manual de Usuario'],
  ['Memoria Analitica', 'src/sections/dialogs/MemoriaAnaliticaWizard.tsx', 'Cerrar Memoria Analitica Wizard'],
  ['Layout Bunker', 'src/sections/dialogs/LayoutBunkerDialog.tsx', 'onOpenChange(false)}><X'],
];

const distFiles = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const info = statSync(path);
    if (info.isDirectory()) walk(path);
    else distFiles.push(path.replaceAll('\\', '/'));
  }
};
walk('dist');

const failures = [];

for (const [, label, file, trace] of fullscreenSurfaces) {
  const source = read(file);
  if (!source.includes("import FullscreenShell from '@/components/FullscreenShell'")) {
    failures.push(`${label} no importa FullscreenShell`);
  }
  if (!source.includes(trace)) failures.push(`${label} no expone trace ${trace}`);
  if (source.includes('fixed inset-0')) failures.push(`${label} conserva overlay fullscreen local`);
}

for (const [, label, file, trace] of dialogShellSurfaces) {
  const source = read(file);
  if (!source.includes("import DialogShell from '@/components/DialogShell'")) {
    failures.push(`${label} no importa DialogShell`);
  }
  if (!source.includes(trace)) failures.push(`${label} no expone trace ${trace}`);
}

for (const [label, file, duplicateNeedle] of complexScreens) {
  if (read(file).includes(duplicateNeedle)) {
    failures.push(`${label} conserva cierre interno duplicado: ${duplicateNeedle}`);
  }
}

const requiredE2EButtons = [
  'e2e-open-evidence-pack',
  'e2e-open-memoria-ai',
  'e2e-open-memoria-wizard',
  'e2e-open-layout-bunker',
  'e2e-open-manual',
  'e2e-open-dashboard',
  'e2e-open-checklist-cnsns',
  'e2e-open-ncrp151-tables',
  'e2e-open-compare-scenarios',
  'e2e-open-tutorial',
  'e2e-open-version-history',
];
const mainPage = read('src/pages/ShieldingDesigner.tsx');
for (const testId of requiredE2EButtons) {
  if (!mainPage.includes(testId)) failures.push(`F401 control E2E faltante: ${testId}`);
}
if (!mainPage.includes("const MemoriaAnaliticaWizard = lazy(() => import('@/sections/dialogs/MemoriaAnaliticaWizard'))")) {
  failures.push('F401 memoriaWizard debe importar MemoriaAnaliticaWizard');
}
if (!mainPage.includes('name="memoriaWizard"') || !mainPage.includes('component={MemoriaAnaliticaWizard}')) {
  failures.push('F401 memoriaWizard debe montar MemoriaAnaliticaWizard, no MemoriaAIWizard');
}

if (!existsSync('dist/index.html')) {
  failures.push('F403 requiere dist/index.html; ejecute npm run build antes del paquete beta');
}

const report = {
  phase: 'F399-F403',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'controlled-beta-ready',
  fullscreenSurfaceCount: fullscreenSurfaces.length,
  dialogShellSurfaceCount: dialogShellSurfaces.length,
  complexScreensCleaned: complexScreens.length,
  e2eOpenControls: requiredE2EButtons.length,
  dist: {
    present: existsSync('dist/index.html'),
    fileCount: distFiles.length,
    indexHash: existsSync('dist/index.html') ? hash(read('dist/index.html')) : null,
  },
  surfaces: {
    fullscreen: fullscreenSurfaces.map(([phase, label, file, trace]) => ({ phase, label, file, trace })),
    dialogShell: dialogShellSurfaces.map(([phase, label, file, trace]) => ({ phase, label, file, trace })),
  },
  failures,
};

writeFileSync(join(outDir, 'f399_f403_window_beta_audit.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error('F399-F403 audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`F399-F403 audit OK: ${report.fullscreenSurfaceCount} fullscreen + ${report.dialogShellSurfaceCount} DialogShell surfaces, ${report.dist.fileCount} dist files.`);
