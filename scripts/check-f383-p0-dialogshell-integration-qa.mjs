import { readFileSync } from 'node:fs';

const files = {
  designer: 'src/pages/ShieldingDesigner.tsx',
  barrier: 'src/sections/dialogs/BarrierEditor.tsx',
  airKerma: 'src/sections/dialogs/AirKermaOverlay.tsx',
  controlPoints: 'src/sections/dialogs/ControlPointsDialog.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');
const designer = read(files.designer);

const checks = [
  [files.designer, "lazy(() => import('@/sections/dialogs/BarrierEditor'))", 'BarrierEditor lazy import is wired'],
  [files.designer, "lazy(() => import('@/sections/dialogs/AirKermaOverlay'))", 'AirKermaOverlay lazy import is wired'],
  [files.designer, "lazy(() => import('@/sections/dialogs/ControlPointsDialog'))", 'ControlPointsDialog lazy import is wired'],
  [files.designer, 'const [showBarrierEditor, setShowBarrierEditor] = useState(false)', 'BarrierEditor state gate exists'],
  [files.designer, 'const [showAirKermaOverlay, setShowAirKermaOverlay] = useState(false)', 'AirKermaOverlay state gate exists'],
  [files.designer, 'const [showControlPoints, setShowControlPoints] = useState(false)', 'ControlPointsDialog state gate exists'],
  [files.designer, 'onBarrierEditor={() => setShowBarrierEditor(true)}', 'BarrierEditor toolbar callback is wired'],
  [files.designer, 'onAirKermaOverlay={() => setShowAirKermaOverlay(true)}', 'AirKermaOverlay toolbar callback is wired'],
  [files.designer, 'onControlPoints={() => setShowControlPoints(true)}', 'ControlPoints toolbar callback is wired'],
  [files.designer, '<BarrierEditorDialog', 'BarrierEditor render branch exists'],
  [files.designer, '<AirKermaOverlayDialog', 'AirKermaOverlay render branch exists'],
  [files.designer, '<ControlPointsDialog', 'ControlPoints render branch exists'],
  [files.barrier, 'f379-barrier-editor-dialogshell', 'BarrierEditor trace exists'],
  [files.airKerma, 'f380-air-kerma-overlay-dialogshell', 'AirKermaOverlay trace exists'],
  [files.controlPoints, 'f381-control-points-dialogshell', 'ControlPoints trace exists'],
  [files.packageJson, 'test:f379:barrier-editor', 'F379 contract exposed'],
  [files.packageJson, 'test:f380:air-kerma-overlay', 'F380 contract exposed'],
  [files.packageJson, 'test:f381:control-points', 'F381 contract exposed'],
  [files.packageJson, 'test:f382:p0-dialogshell-closure', 'F382 closure contract exposed'],
  [files.packageJson, 'test:f383:p0-integration-qa', 'F383 QA contract exposed'],
  [files.changelog, 'F383', 'Changelog includes F383'],
  [files.versions, 'F383', 'Version manual includes F383'],
  [files.manual, 'Addendum F383', 'User manual includes F383'],
  [files.update, 'F383 P0 integration QA', 'Update Center includes F383'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

for (const [file, label] of [
  [files.barrier, 'BarrierEditor'],
  [files.airKerma, 'AirKermaOverlay'],
  [files.controlPoints, 'ControlPointsDialog'],
]) {
  const text = read(file);
  if (!text.includes("import DialogShell from '@/components/DialogShell'")) {
    failures.push([file, 'DialogShell import', `${label} imports DialogShell`]);
  }
  if (text.includes('fixed inset-0 z-50 bg-black/50')) {
    failures.push([file, 'no legacy fullscreen overlay', `${label} removed legacy overlay`]);
  }
}

if (designer.includes('setShowBarrierEditor(false)') === false) {
  failures.push([files.designer, 'setShowBarrierEditor(false)', 'BarrierEditor closes from designer']);
}
if (designer.includes('setShowAirKermaOverlay(false)') === false) {
  failures.push([files.designer, 'setShowAirKermaOverlay(false)', 'AirKermaOverlay closes from designer']);
}
if (designer.includes('setShowControlPoints(false)') === false) {
  failures.push([files.designer, 'setShowControlPoints(false)', 'ControlPoints closes from designer']);
}

if (failures.length) {
  console.error('F383 P0 DialogShell integration QA failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F383 P0 DialogShell integration QA OK (${checks.length + 6} checks).`);
