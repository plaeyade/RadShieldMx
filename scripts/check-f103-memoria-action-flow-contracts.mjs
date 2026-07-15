import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f103MemoriaWorkflowActions.ts',
    tokens: [
      'F103_MEMORIA_WORKFLOW_ACTIONS',
      'getF103MemoriaWorkflowAction',
      "stepId: 'layout'",
      "dialogName: 'layoutBunker'",
      "stepId: 'equipment'",
      "dialogName: 'sourceLibrary'",
      "stepId: 'zones'",
      "dialogName: 'controlPoints'",
      "stepId: 'barriers'",
      "dialogName: 'barrierEditor'",
      "stepId: 'calculation'",
      "dialogName: 'barrierCalculator'",
      "stepId: 'evidence'",
      "dialogName: 'evidencePack'",
    ],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: [
      'getF103MemoriaWorkflowAction',
      'f103WorkflowActions',
      'runF103WorkflowAction',
      'setActiveTool(workflowAction.tool)',
      'open(workflowAction.dialogName)',
      'FLUJO ACCIONABLE F103',
      'data-testid={`f103-action-${item.id}`}',
      'data-testid="f103-next-action"',
    ],
  },
  {
    file: 'outputs/fase_103_memoria_action_flow.md',
    tokens: [
      'F103',
      'Memoria IA',
      'acciones',
      'floorplan',
      'equipo',
      'calculo',
      'evidencia',
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
  console.error('F103 memoria action flow contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F103 memoria action flow contracts OK');
