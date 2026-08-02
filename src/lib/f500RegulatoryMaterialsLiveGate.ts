import { buildF499RegulatoryMaterialsSeedDryRun } from '@/lib/f499RegulatoryMaterialsSeedDryRun';

export interface F500RegulatoryMaterialsLiveGate {
  schema: 'radshield-mx.db.regulatory-materials.live-gate.f500.v1';
  phase: 'F500';
  status: 'blocked' | 'ready-for-controlled-live-seed';
  liveWriteAllowed: false;
  requiredTables: string[];
  f499Counts: {
    regulatorySources: number;
    materialConstants: number;
    materialValueVersions: number;
    materialSourceLinks: number;
    reviewRequiredValueVersions: number;
  };
  requiredChecks: string[];
  blockers: string[];
  nextPhase: string;
}

export function buildF500RegulatoryMaterialsLiveGate(): F500RegulatoryMaterialsLiveGate {
  const seed = buildF499RegulatoryMaterialsSeedDryRun();
  const blockers = [
    'Ejecutar restore probe F153 vigente antes de cualquier escritura live.',
    'Verificar que las tablas regulatorias existan o aplicar migracion revisada.',
    'Resolver page_ref/hash en document_chunks para fuentes normativas y materiales.',
    'Promover valores vendor/lab solo con aprobacion documental y tecnica.',
  ];

  return {
    schema: 'radshield-mx.db.regulatory-materials.live-gate.f500.v1',
    phase: 'F500',
    status: 'blocked',
    liveWriteAllowed: false,
    requiredTables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'],
    f499Counts: {
      regulatorySources: seed.counts.regulatorySources,
      materialConstants: seed.counts.materialConstants,
      materialValueVersions: seed.counts.materialValueVersions,
      materialSourceLinks: seed.counts.materialSourceLinks,
      reviewRequiredValueVersions: seed.counts.reviewRequiredValueVersions,
    },
    requiredChecks: [
      'F499 manifest present and duplicate-free.',
      'DATABASE_URL points to intended MySQL database.',
      'F153 backup/restore probe is ready.',
      'DB readback confirms required tables and row counts before/after seed.',
      'F484-F490 normative QA is repeated after live readback.',
    ],
    blockers,
    nextPhase: 'F501 controlled live seed only after F500 blockers are zero.',
  };
}

export function formatF500RegulatoryMaterialsLiveGateMarkdown(contract = buildF500RegulatoryMaterialsLiveGate()): string {
  return [
    '# F500 LIVE GATE DB REGULATORIA/MATERIALES',
    '',
    `Estado: ${contract.status}`,
    `Escritura live permitida: ${contract.liveWriteAllowed ? 'si' : 'no'}`,
    `Fuentes F499: ${contract.f499Counts.regulatorySources}`,
    `Materiales F499: ${contract.f499Counts.materialConstants}`,
    `Versiones F499: ${contract.f499Counts.materialValueVersions}`,
    `Valores en revision: ${contract.f499Counts.reviewRequiredValueVersions}`,
    '',
    '## Tablas requeridas',
    ...contract.requiredTables.map((table) => `- ${table}`),
    '',
    '## Checks requeridos',
    ...contract.requiredChecks.map((check) => `- ${check}`),
    '',
    '## Bloqueos',
    ...contract.blockers.map((blocker) => `- ${blocker}`),
    '',
    `Siguiente fase: ${contract.nextPhase}`,
  ].join('\n');
}
