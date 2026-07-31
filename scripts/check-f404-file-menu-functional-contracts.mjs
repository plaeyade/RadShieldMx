import { existsSync, readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
const reportPath = 'outputs/f404_file_menu_functional_qa/f404_file_menu_functional_qa.json';

const checks = [
  ['src/sections/Toolbar.tsx', 'testId="f404-file-open-projects"', 'Archivo open projects testid'],
  ['src/sections/Toolbar.tsx', 'testId="f404-file-tech-specs"', 'Archivo tech specs testid'],
  ['src/sections/dialogs/TechSpecsDialog.tsx', 'f404-tech-specs-dialog', 'TechSpecs real dialog'],
  ['e2e/f404-file-menu-functional.spec.ts', 'f404-file-menu-functional', 'F404 E2E file exists'],
  ['package.json', 'prepare:f404:file-menu-functional', 'F404 prepare script'],
  ['package.json', 'test:f404:file-menu-functional', 'F404 contract script'],
  ['package.json', 'test:f404:file-menu-functional:e2e', 'F404 E2E script'],
  ['CHANGELOG.md', 'F404', 'Changelog documents F404'],
  ['MANUAL_VERSIONES_v50.md', 'F404', 'Version manual documents F404'],
  ['MANUAL_USUARIO_v99.md', 'Addendum F404', 'User manual documents F404'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F404 Archivo funcional', 'Update Center documents F404'],
];

const failures = checks.filter(([file, needle]) => !existsSync(file) || !read(file).includes(needle));

if (!existsSync(reportPath)) {
  failures.push([reportPath, 'exists', 'F404 report generated']);
} else {
  const report = JSON.parse(read(reportPath));
  if (report.status !== 'archivo-menu-functional-ready') {
    failures.push([reportPath, 'archivo-menu-functional-ready', 'F404 report status']);
  }
  if (report.itemCount !== 15 || report.browserVerifiedItems !== 11) {
    failures.push([reportPath, '15 items / 11 browser verified', 'F404 coverage counts']);
  }
}

if (failures.length) {
  console.error('F404 contract failures:');
  for (const [file, needle, label] of failures) console.error(`- ${label}: missing "${needle}" in ${file}`);
  process.exit(1);
}

console.log(`F404 contracts OK (${checks.length + 2} checks).`);
