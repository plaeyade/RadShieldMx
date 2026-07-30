import { readFileSync } from 'node:fs';

const files = {
  shell: 'src/components/SidePanelShell.tsx',
  faq: 'src/components/FAQPanel.tsx',
  plugin: 'src/components/PluginManager.tsx',
  rag: 'src/sections/RAGIngestionPanel.tsx',
  memory: 'src/sections/CalculationMemoryPanel.tsx',
  packageJson: 'package.json',
  changelog: 'CHANGELOG.md',
  versions: 'MANUAL_VERSIONES_v50.md',
  manual: 'MANUAL_USUARIO_v99.md',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
};

const read = (file) => readFileSync(file, 'utf8');

const checks = [
  [files.shell, 'f377-side-panel-shell', 'SidePanelShell expone shell trazable'],
  [files.shell, 'f377-side-panel-minimize', 'SidePanelShell expone minimizar'],
  [files.shell, 'f377-side-panel-close', 'SidePanelShell expone cerrar'],
  [files.shell, 'f377-side-panel-restore', 'SidePanelShell expone restaurar'],
  [files.faq, 'SidePanelShell', 'FAQ usa SidePanelShell'],
  [files.plugin, 'SidePanelShell', 'PluginManager usa SidePanelShell'],
  [files.rag, 'data-f377-panel="rag-ingestion"', 'RAG tiene controles F377'],
  [files.memory, 'data-f377-panel="calculation-memory"', 'Memorias tiene controles F377'],
  [files.rag, 'f377-side-panel-minimize', 'RAG expone minimizar'],
  [files.memory, 'f377-side-panel-minimize', 'Memorias expone minimizar'],
  [files.packageJson, 'test:f377:side-panels', 'package expone contrato F377'],
  [files.changelog, 'F377', 'Changelog incluye F377'],
  [files.versions, 'F377', 'Manual de versiones incluye F377'],
  [files.manual, 'Addendum F377', 'Manual usuario incluye F377'],
  [files.update, 'F377 Side panel controls', 'Update Center incluye F377'],
];

const failures = checks.filter(([file, needle]) => !read(file).includes(needle));

if (failures.length) {
  console.error('F377 side panel control contract failures:');
  for (const [file, needle, label] of failures) {
    console.error(`- ${label}: missing "${needle}" in ${file}`);
  }
  process.exit(1);
}

console.log(`F377 side panel controls contracts OK (${checks.length} checks).`);
