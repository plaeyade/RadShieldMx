import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const canvas = readFileSync(join(root, 'src/sections/CanvasArea.tsx'), 'utf8');
const designer = readFileSync(join(root, 'src/pages/ShieldingDesigner.tsx'), 'utf8');

const checks = [
  {
    id: 'welcome-disabled-by-default',
    ok: designer.includes('const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);'),
    detail: 'The startup welcome/example layer must not cover the floorplan by default.',
  },
  {
    id: 'empty-canvas-state',
    ok: canvas.includes('data-testid="f182-empty-canvas-state"') && canvas.includes('No se carga ejemplo inicial.'),
    detail: 'Blank projects expose a clean empty-state with import/template/layers actions.',
  },
  {
    id: 'compact-workspace-dock',
    ok: canvas.includes('data-testid="f182-canvas-workspace-dock"') && canvas.includes('CAD workspace'),
    detail: 'Canvas QA tools are behind a compact dock instead of covering the layout.',
  },
  {
    id: 'compact-workflow-panel',
    ok: canvas.includes('data-testid="f182-canvas-workflow-compact"') && canvas.includes('setWorkflowCollapsed'),
    detail: 'The workflow panel is collapsed by default and can be expanded on demand.',
  },
  {
    id: 'toolbar-overflow-safe',
    ok: canvas.includes('overflow-x-auto overflow-y-hidden'),
    detail: 'The canvas top bar scrolls horizontally instead of pushing into the drawing surface.',
  },
];

const failed = checks.filter(check => !check.ok);
const outDir = join(root, 'outputs/f182_canvas_professional_workspace');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'f182_canvas_professional_workspace.json'),
  JSON.stringify({ phase: 'F182', status: failed.length === 0 ? 'ready' : 'failed', checks }, null, 2),
);

if (failed.length > 0) {
  console.error(JSON.stringify({ phase: 'F182', failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ phase: 'F182', status: 'ready', checks: checks.length }, null, 2));
