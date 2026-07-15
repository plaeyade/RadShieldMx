import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f102MemoriaDesignPlan.ts',
    tokens: [
      'buildF102MemoryDesignPlan',
      'Leer floorplan y escala',
      'Identificar equipo y fuente',
      'Definir zonas controladas y ocupacion',
      'Clasificar barreras por uso',
      'Completar carga de trabajo',
      'Ejecutar calculo y validar',
      'Preparar evidencia y anexos',
      'recommendedStandard',
      'nextBestAction',
    ],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: [
      'buildF102MemoryDesignPlan',
      'f102-memoria-design-plan',
      'f102-next-best-action',
      'data-testid={`f102-step-${item.id}`}',
      'DISENO GUIADO DE MEMORIA ANALITICA SEGUN FLOORPLAN Y EQUIPO',
      'Score de preparacion',
    ],
  },
  {
    file: 'outputs/fase_102_memoria_ia_design_plan.md',
    tokens: [
      'F102',
      'Memoria IA',
      'floorplan',
      'equipo',
      'paso a paso',
      'pendientes',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) missing.push(`${check.file}: ${token}`);
  }
}

if (missing.length > 0) {
  console.error('F102 memoria design plan contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F102 memoria design plan contracts OK');
