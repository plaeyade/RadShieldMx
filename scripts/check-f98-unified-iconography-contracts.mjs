import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f98UnifiedIconography.ts',
    tokens: [
      'CANVAS_TOOL_ICON_PROFILES',
      'EQUIPMENT_ICON_PROFILES',
      'F98_RELEASE_GAP_CHECKLIST',
      'summarizeF98ReleaseGaps',
      'canvas_floorplan',
      'heat_maps',
      'database',
    ],
  },
  {
    file: 'src/lib/canvas/CanvasRenderer.ts',
    tokens: [
      'getEquipmentIconProfile',
      'unifiedIcon.color',
      'unifiedIcon.shortLabel',
    ],
  },
  {
    file: 'src/sections/Sidebar.tsx',
    tokens: [
      'getCanvasToolIconProfile',
      'CANVAS_TOOL_ICON_PROFILES',
      'f98-unified-canvas-buttons',
      'region',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'getCanvasToolIconProfile',
      'f98-active-canvas-tool-indicator',
      'currentTool.description',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'summarizeF98ReleaseGaps',
      'F98 Unified iconography + release gaps',
      'f98-release-gap-summary',
      'remainingForFinalRelease',
    ],
  },
  {
    file: 'outputs/fase_98_unified_iconography_release_gaps.md',
    tokens: [
      'F98',
      '8 puntos',
      'DB',
      'release final',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      missing.push(`${check.file}: ${token}`);
    }
  }
}

if (missing.length > 0) {
  console.error('F98 unified iconography contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F98 unified iconography contracts OK');
