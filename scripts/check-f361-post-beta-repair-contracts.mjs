import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const manifestPath = path.join(root, 'outputs', 'f361_post_beta_repair', 'f361_post_beta_repair.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

const canvas = read('src/sections/CanvasArea.tsx');
const shell = read('src/components/DialogShell.tsx');
const toolbar = read('src/sections/Toolbar.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));
const dbDraft = JSON.parse(fs.readFileSync(path.join(root, 'outputs', 'f361_post_beta_repair', 'f361_kiube_document_chunks_db_draft.json'), 'utf8'));

expect('F361 schema', manifest.schema === 'radshield-mx.f361.post-beta-repair.v1');
expect('F361 ready', manifest.status === 'post-beta-repair-ready');
expect('Beta explicitly marked incomplete until repair validation', manifest.betaStatus.includes('incomplete'));
expect('KIUBE PDF hash present', typeof manifest.sourcePdf.sha256 === 'string' && manifest.sourcePdf.sha256.length === 64);
expect('KIUBE modeled/code dedupe decision present', manifest.sourcePdf.dedupeDecision.includes('rag-evidence'));
expect('Canvas context menu exists', canvas.includes('data-testid="canvas-context-menu"'));
expect('Canvas context menu has calculate/evidence/3D actions', canvas.includes('Calcular blindaje') && canvas.includes('Abrir evidencia') && canvas.includes('Inspeccion 3D medica'));
expect('Dialog shell draggable controls exist', shell.includes('data-testid="draggable-dialog-shell"') && shell.includes('data-dialog-minimized') && shell.includes('data-dialog-maximized'));
expect('Toolbar file menu alignment hardened', toolbar.includes('data-testid="f295-primary-file-menu"') && toolbar.includes('w-72 max-w-[calc(100vw-24px)]'));
expect('Toolbar quick access uses valid Update Center fallback', toolbar.includes("invoke(onUpdate, 'updateCenter')"));
expect('Toolbar File/DXF/PDF fallbacks exist', toolbar.includes("invoke(onDXFViewer, 'dxfViewer')") && toolbar.includes("invoke(onPDF, 'pdfReport')"));
expect('Update Center documents F361', update.includes('F361 Post-beta repair'));
expect('Changelog documents F361', changelog.includes('F361'));
expect('Manual versions documents F361', versions.includes('F361'));
expect('User manual documents F99-F360 and F361', manual.includes('F99-F360') && manual.includes('F361'));
expect('Package prepare script exists', Boolean(pkg.scripts['prepare:f361:post-beta-repair']));
expect('Package test script exists', Boolean(pkg.scripts['test:f361:post-beta-repair']));
expect('DB draft aligns with manifest chunks', dbDraft.chunks.length === manifest.sourcePdf.chunkCount);

if (failures.length) {
  console.error('F361 post-beta repair contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F361 post-beta repair contracts passed.');
