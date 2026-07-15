import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f91ReleaseRoadmap.ts',
    tokens: [
      'RELEASE_IMPROVEMENT_ROADMAP',
      'buildF91CanvasAdvancedSummary',
      'buildF91MemoriaAIPlan',
      'F92',
      'F93',
      'F94',
      'F96',
      'Canvas avanzado CAD-like',
      'Memoria IA reviewer',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'f91-canvas-advanced-panel',
      'f91-chip-${String(label).toLowerCase()}',
      'buildF91CanvasAdvancedSummary',
      'F91 {f91Canvas.precisionScore}%',
    ],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: [
      'buildF91MemoriaAIPlan',
      'memoria-f91-improvement-plan',
      'PLAN DE MEJORA IA / QA HACIA RELEASE',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F91 Advanced canvas roadmap', 'CAD readiness + Memoria IA priorities'],
  },
  {
    file: 'package.json',
    tokens: ['test:f91:canvas-roadmap'],
  },
  {
    file: 'outputs/fase_91_canvas_roadmap_memoria_ia.md',
    tokens: ['Fase 91', 'F92', 'F93', 'Memoria IA', 'prioridad'],
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
  console.error('F91 advanced canvas roadmap contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F91 advanced canvas roadmap contract OK');
