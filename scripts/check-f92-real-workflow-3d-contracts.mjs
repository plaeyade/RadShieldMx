import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f92RealWorkflow.ts',
    tokens: [
      'F92_REAL_WORKFLOW',
      'buildF923DInspectionSummary',
      'design',
      'equipment',
      'shielding',
      'verification',
      'reports',
      'evidence',
      'integrations',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f92-real-workflow-nav',
      'f92-flow-${stage.id}',
      'F92_REAL_WORKFLOW',
      'Diseno Equipos Blindaje Verificacion Reportes Evidencia Integraciones',
    ],
  },
  {
    file: 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
    tokens: [
      'buildF923DInspectionSummary',
      'f92-3d-inspection-readiness',
      'F92 inspeccion 3D',
      'maxWallThickness_m',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F92 Real workflow + 3D inspection', 'Design to Integrations flow'],
  },
  {
    file: 'package.json',
    tokens: ['test:f92:real-workflow-3d'],
  },
  {
    file: 'outputs/fase_92_real_workflow_3d.md',
    tokens: ['Fase 92', 'Diseño → Equipos → Blindaje → Verificación → Reportes → Evidencia → Integraciones', 'inspección 3D'],
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
  console.error('F92 real workflow + 3D contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F92 real workflow + 3D contract OK');
