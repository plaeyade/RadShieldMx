import { existsSync, readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const reportPath = 'outputs/f399_f403_window_beta_audit/f399_f403_window_beta_audit.json';

const checks = [
  ['src/pages/ShieldingDesigner.tsx', 'e2e-open-layout-bunker', 'F401 Layout E2E opener'],
  ['src/pages/ShieldingDesigner.tsx', 'e2e-open-ncrp151-tables', 'F401 NCRP E2E opener'],
  ['src/pages/ShieldingDesigner.tsx', 'component={MemoriaAnaliticaWizard}', 'F401 memoriaWizard route uses MemoriaAnaliticaWizard'],
  ['src/pages/ShieldingDesigner.tsx', "const TutorialDialog = lazy(() => import('@/sections/dialogs/TutorialDialog'))", 'F401 tutorial route uses TutorialDialog'],
  ['src/components/FullscreenShell.tsx', 'data-fullscreen-shell-contained', 'FullscreenShell contained state'],
  ['src/components/DialogShell.tsx', 'data-dialog-maximized', 'DialogShell window controls'],
  ['e2e/f399-f403-controlled-surfaces.spec.ts', 'fullscreen controlled surfaces expose minimize/contained/close controls', 'F401 Playwright smoke exists'],
  ['CHANGELOG.md', 'F399-F403', 'Changelog documents F399-F403'],
  ['MANUAL_VERSIONES_v50.md', 'F399-F403', 'Version manual documents F399-F403'],
  ['MANUAL_USUARIO_v99.md', 'Addendum F399-F403', 'User manual documents F399-F403'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F399-F403 Beta controlado', 'Update Center documents F399-F403'],
  ['package.json', 'prepare:f399-f403:window-beta', 'Package prepare script'],
  ['package.json', 'test:f399-f403:window-beta', 'Package contract script'],
];

const failures = checks.filter(([file, needle]) => !existsSync(file) || !read(file).includes(needle));

if (!existsSync(reportPath)) {
  failures.push([reportPath, 'exists', 'F399-F403 report generated']);
} else {
  const report = JSON.parse(read(reportPath));
  if (report.status !== 'controlled-beta-ready') {
    failures.push([reportPath, 'controlled-beta-ready', 'F399-F403 report status']);
  }
  if (report.fullscreenSurfaceCount !== 7 || report.dialogShellSurfaceCount !== 3 || report.complexScreensCleaned !== 4) {
    failures.push([reportPath, '7 fullscreen, 3 dialog, 4 cleaned', 'F399-F403 surface counts']);
  }
}

if (failures.length) {
  console.error('F399-F403 contract failures:');
  for (const [file, needle, label] of failures) console.error(`- ${label}: missing "${needle}" in ${file}`);
  process.exit(1);
}

console.log(`F399-F403 contracts OK (${checks.length + 2} checks).`);
