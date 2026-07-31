import { existsSync, readFileSync } from 'node:fs';

const files = {
  prepare: 'scripts/f384-post-beta-backlog-status.mjs',
  report: 'outputs/f384_post_beta_backlog/f384_post_beta_backlog_status.json',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');

const checks = [
  [files.prepare, 'babylon-runtime', 'Backlog tracks Babylon'],
  [files.prepare, 'unity-webgl-external', 'Backlog tracks Unity WebGL'],
  [files.prepare, 'dwg-provider', 'Backlog tracks DWG provider'],
  [files.prepare, 'mc-runners', 'Backlog tracks MC runners'],
  [files.prepare, 'renderer-base-v2', 'Backlog tracks renderer base'],
  [files.prepare, 'advanced-photorealism', 'Backlog tracks photorealism'],
  [files.prepare, 'Do not market Babylon runtime', 'Backlog includes release rule'],
  [files.packageJson, 'prepare:f384:post-beta-backlog', 'Package exposes F384 prepare'],
  [files.packageJson, 'test:f384:post-beta-backlog', 'Package exposes F384 test'],
  [files.changelog, 'F384', 'Changelog includes F384'],
  [files.versions, 'F384', 'Version manual includes F384'],
  [files.manual, 'Addendum F384', 'User manual includes F384'],
  [files.update, 'F384 Post-beta backlog status', 'Update Center includes F384'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (!existsSync(files.report)) {
  failures.push([files.report, 'exists', 'Generated F384 JSON report exists']);
} else {
  const manifest = JSON.parse(read(files.report));
  const requiredIds = ['babylon-runtime', 'unity-webgl-external', 'dwg-provider', 'mc-runners', 'renderer-base-v2', 'advanced-photorealism'];
  for (const id of requiredIds) {
    if (!manifest.statusItems?.some((item) => item.id === id)) {
      failures.push([files.report, id, `Manifest includes ${id}`]);
    }
  }
  if (!manifest.notCompletedAsProductionFeatures?.includes('Babylon runtime')) {
    failures.push([files.report, 'Babylon runtime not completed', 'Manifest does not overclaim Babylon']);
  }
}

if (failures.length) {
  console.error('F384 post-beta backlog status contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F384 post-beta backlog status contracts OK (${checks.length + 8} checks).`);
