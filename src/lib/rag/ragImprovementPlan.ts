export interface RagImprovement {
  id: string;
  title: string;
  value: string;
  implementation: string;
  priority: 'now' | 'next' | 'later';
}

export const RAG_IMPROVEMENT_PLAN: RagImprovement[] = [
  {
    id: 'hybrid-search',
    title: 'Hybrid lexical + vector search',
    value: 'Mejora recall en terminos tecnicos como TVL, workload, occupancy, maze, NCRP 151 y TG-108.',
    implementation: 'Combinar busqueda BM25/keyword con similitud vectorial y fusion Reciprocal Rank Fusion.',
    priority: 'now',
  },
  {
    id: 'citation-ledger',
    title: 'Citation ledger for analytic memories',
    value: 'Cada afirmacion de memoria analitica queda trazada a fuente, seccion, pagina y confianza.',
    implementation: 'Guardar sourceId, pageRef, section, excerptHash y claimId en Evidence Pack/report exports.',
    priority: 'now',
  },
  {
    id: 'regulatory-rerank',
    title: 'Regulatory reranker',
    value: 'Prioriza normas aplicables por modalidad: NCRP 147/151, IAEA SRS-47, AAPM TG-108, CNSNS/UAQ.',
    implementation: 'Rerank por modalidad, pais, energia, tipo de barrera y tipo de documento.',
    priority: 'next',
  },
  {
    id: 'document-fingerprints',
    title: 'Document fingerprints',
    value: 'Evita duplicados y permite auditoria de versiones de PDFs/manuales usados como soporte.',
    implementation: 'Calcular hash, version, fecha de ingesta y cobertura por capitulo antes de vectorizar.',
    priority: 'next',
  },
  {
    id: 'deep-dive-queries',
    title: 'Deep-dive query planner',
    value: 'Permite revisiones exhaustivas para sustentar memoria analitica con varias pasadas.',
    implementation: 'Descomponer pregunta en subconsultas: normativa, fisica, equipos, calculo, QA y reporte.',
    priority: 'next',
  },
  {
    id: 'external-browser-connector',
    title: 'External browser connector',
    value: 'Integra busqueda web/scraping controlado sin mezclarlo con el core offline.',
    implementation: 'Mantener FSB/Browserbase Skills como integracion externa con allowlist, cache y aprobacion de fuentes.',
    priority: 'later',
  },
];

export function getImmediateRagImprovements() {
  return RAG_IMPROVEMENT_PLAN.filter((item) => item.priority === 'now');
}
