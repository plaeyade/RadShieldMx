import { F92_REAL_WORKFLOW, type F92WorkflowStageId } from '@/lib/f92RealWorkflow';

export interface F110EvidenceMenuMigration {
  phase: 'F110';
  status: 'controlled-migration';
  targetFlow: string[];
  migratedGroups: Array<{
    id: F92WorkflowStageId;
    label: string;
    physicalState: 'canonical-dropdown' | 'pending';
    legacyFallback: 'hidden' | 'labeled-rollback' | 'unchanged';
  }>;
  canonicalCommands: string[];
  labeledRollbackItems: string[];
  ragBoundary: string;
  nextGroups: string[];
  physicalRemovalNow: boolean;
  decision: string;
}

export function buildF110EvidenceMenuMigration(): F110EvidenceMenuMigration {
  const canonicalIds: F92WorkflowStageId[] = ['design', 'equipment', 'shielding', 'verification', 'reports', 'evidence'];

  return {
    phase: 'F110',
    status: 'controlled-migration',
    targetFlow: F92_REAL_WORKFLOW.map((stage) => stage.label),
    migratedGroups: F92_REAL_WORKFLOW.map((stage) => ({
      id: stage.id,
      label: stage.label,
      physicalState: canonicalIds.includes(stage.id) ? 'canonical-dropdown' : 'pending',
      legacyFallback: stage.id === 'design' ? 'hidden' : canonicalIds.includes(stage.id) ? 'labeled-rollback' : 'unchanged',
    })),
    canonicalCommands: [
      'Evidence Pack',
      'RAG deep dive',
      'Reference Library',
      'Bibliografia',
      'Audit Trail',
      'Audit Log',
      'Log analysis',
      'Technical specs',
      'AI source review',
      'Algorithm / code audit',
    ],
    labeledRollbackItems: [
      'Evidence Pack fallback F110',
      'Bibliografia fallback F110',
      'Audit Trail fallback F110',
      'Audit Log fallback F110',
      'Log analysis fallback F110',
      'AI Assistant fallback F110',
      'Technical Audit fallback F110',
    ],
    ragBoundary: 'RAG ingestion remains offline-safe in F110. The canonical Evidence menu opens review and evidence surfaces now; live DB/vector persistence remains gated by MySQL availability.',
    nextGroups: ['Integraciones'],
    physicalRemovalNow: false,
    decision: 'Evidence becomes canonical in F110. Legacy documentation, audit and AI/RAG entries remain labeled fallback until Evidence Pack, bibliography, RAG and audit smoke pass.',
  };
}
