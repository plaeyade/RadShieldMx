import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f356_f360_beta_release');
const f350Path = path.join(root, 'outputs', 'f350_f355_real_test_package', 'f350_f355_real_test_package.json');

fs.mkdirSync(outDir, { recursive: true });

function readJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required manifest: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function csvCell(value) {
  return JSON.stringify(String(value ?? ''));
}

function writeCsv(filePath, rows) {
  fs.writeFileSync(filePath, rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n', 'utf8');
}

const f350 = readJson(f350Path);
const rows = f350.realTestRows ?? [];

const userTestChecklist = [
  ['open-app', 'Abrir app en navegador', 'ready-for-user-test', 'Confirmar carga de topbar, sidebar, canvas y paneles.'],
  ['file-menu', 'Menu Archivo', 'ready-for-user-test', 'Abrir/cerrar menu, revisar importar/exportar/guardar sin desplazar canvas.'],
  ['load-plan', 'Cargar plano', 'ready-for-user-test', 'Usar plano Centro Neuro o PDF/DXF disponible; si falla DWG nativo, usar conversion externa.'],
  ['canvas-tools', 'Canvas/floorplan', 'ready-for-user-test', 'Ver sidebar estable, herramientas, leyendas, capas, equipos, cotas e inspeccion visual.'],
  ['memoria-ia', 'Memoria IA', 'ready-for-user-test', 'Generar flujo preliminar por modalidad y confirmar evidencia por equipo.'],
  ['evidence-pack', 'Evidence Pack', 'ready-for-user-test', 'Confirmar hashes, supuestos, warnings y matriz de consistencia.'],
  ['medical-3d', 'Medical 3D', 'ready-for-user-test', 'Revisar recorrido visual y bandas de material/equipo.'],
  ['reports', 'Reportes/PDF', 'ready-for-user-test', 'Confirmar marca PRELIMINAR / NO CERTIFICADO.'],
];

const missingDataFields = [
  ['geometry-lock', 'Geometria trazada definitiva', 'operator-input-required', 'Bloquear poligonos/salas/barreras despues de revisar escala 1:100.'],
  ['vendor-source', 'Fuente real/proveedor', 'partially-defaulted', 'Sustituir cargas maximas estandar por hoja tecnica/programa clinico versionado.'],
  ['workload', 'Carga de trabajo', 'operator-input-required', 'Confirmar W, U, T, P y regimen anual/semanal por modalidad.'],
  ['tvl-density', 'TVL/densidad con cita/hash', 'partially-defaulted', 'Reemplazar valores candidatos por tabla versionada y pagina exacta.'],
  ['penetrations', 'Penetraciones', 'standard-default-applied', 'Confirmar puerta, ductos, conduits, cable trays, HVAC y servicios.'],
  ['structural', 'Carga estructural/costo/tiempo', 'engineering-review-required', 'Usar toolbox de materiales para kg/m2, costo y plazo; no bloquea beta.'],
  ['fm-rso', 'Revision FM/RSO', 'deferred-for-beta', 'Requerida para memoria firmable; no requerida para beta operativa.'],
];

function calcBarrierDraft(row) {
  const modalityMethod = row.modalityProfile === 'CY'
    ? 'CY-PRELIM-NEUTRON-PHOTON-CHECK'
    : row.equipmentLabel.toLowerCase().includes('gamma')
      ? 'TG-CO60-TVL-CHECK'
      : row.modalityProfile === 'NM'
        ? 'NM-POINT-SOURCE-CHECK'
        : 'NCRP151-TVL-PRELIM-CHECK';

  const warningSet = [
    'preliminary-only',
    'requires-versioned-source-term',
    'requires-final-geometry-lock',
    'requires-page-level-tvl-citation',
  ];
  if (row.modalityProfile === 'CY') warningSet.push('cyclotron-neutron-activation-check-required');
  if (/15 MeV|18 MeV/i.test(row.provider)) warningSet.push('high-energy-neutron-secondary-review-required');
  if (row.penetrationStatus !== 'resolved') warningSet.push('penetration-dose-streaming-review-required');

  return {
    calculationId: `f358-${row.roomId}-prelim-trace`,
    roomId: row.roomId,
    equipmentLabel: row.equipmentLabel,
    formulaId: modalityMethod,
    standard: row.modalityProfile === 'CY' ? 'NCRP151/IAEA/UAQ cyclotron workflow placeholder' : 'NCRP151/IAEA/UAQ preliminary workflow',
    inputs: {
      provider: row.provider,
      sourceTerm: row.sourceTerm,
      geometry: row.geometry,
      material: row.material,
      densityKgM3: row.densityKgM3,
      tvlCm: row.tvlCm,
      penetrations: row.penetrationBasis,
      structuralLoadKgM2: row.structuralLoadKgM2,
    },
    outputs: {
      calculationClass: 'traceable-preliminary',
      thicknessCm: null,
      reasonNoThickness: 'Thickness is intentionally withheld until geometry, workload and page-level citations are locked.',
      evidenceHash: sha256Text(`${row.roomId}|${row.sourceFingerprint}|${row.materialFingerprint}|${row.geometry}`),
    },
    assumptions: [
      'public adjacency conservative workflow',
      'standard or memory-derived defaults used for beta',
      'FM/RSO review deferred for beta only',
    ],
    warnings: warningSet,
    signedStatus: 'not-certified',
  };
}

const preliminaryCalculations = rows.map(calcBarrierDraft);

const memoriaSections = rows.map((row) => {
  const calc = preliminaryCalculations.find((item) => item.roomId === row.roomId);
  return {
    sectionId: `f359-${row.roomId}-memoria-section`,
    title: `${row.equipmentLabel} - seccion preliminar`,
    body: [
      `Equipo: ${row.equipmentLabel}.`,
      `Fuente/proveedor: ${row.provider}.`,
      `Metodo: ${calc.formulaId}; norma/metodologia: ${calc.standard}.`,
      `Material preliminar: ${row.material}; densidad ${row.densityKgM3} kg/m3; TVL ${row.tvlCm}.`,
      `Penetraciones consideradas: ${row.penetrationBasis}.`,
      `Estado: preliminar beta, no certificado, sin espesor firmable.`,
    ],
    citationIds: [row.sourceFingerprint, row.materialFingerprint],
    warnings: calc.warnings,
    exportStatus: 'ready-for-beta-pdf-draft',
  };
});

const betaDecision = {
  phase: 'F360',
  releaseTrack: 'beta',
  decision: 'release-as-beta',
  allowedUse: [
    'prueba real de usuario',
    'revision de flujo Canvas a Memoria IA',
    'captura de datos faltantes',
    'validacion visual de 3D/reportes/evidence pack',
  ],
  blockedUse: [
    'memoria analitica firmada',
    'espesores certificados',
    'dictamen final de proteccion radiologica',
    'liberacion clinica/constructiva sin revision profesional',
  ],
  requiredBeforeStableRelease: [
    'lock de geometria definitiva',
    'fuentes y cargas de trabajo versionadas',
    'TVL/densidad con documento, pagina y hash',
    'penetraciones resueltas',
    'QA numerico contra casos conocidos',
    'restore DB y smoke backend si se entrega fullstack',
  ],
};

const visualSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="820" viewBox="0 0 1320 820" role="img" aria-label="F356-F360 beta release visual">
  <rect width="1320" height="820" fill="#f8fafc"/>
  <text x="42" y="50" font-family="Arial, sans-serif" font-size="29" font-weight="700" fill="#0f172a">F356-F360 - Beta operativa RadShield-MX</text>
  <text x="42" y="78" font-family="Arial, sans-serif" font-size="14" fill="#475569">Prueba real guiada -> captura de faltantes -> calculo trazable preliminar -> memoria preliminar -> release beta.</text>
  <rect x="42" y="108" width="1236" height="58" rx="10" fill="#fff7ed" stroke="#f97316"/>
  <text x="66" y="144" font-family="Arial" font-size="18" font-weight="700" fill="#9a3412">BETA / NO CERTIFICADO - permitido para prueba real de usuario; bloqueado para memoria firmada.</text>
  <g transform="translate(54,205)">
    ${['F356 Prueba real', 'F357 Datos faltantes', 'F358 Calculo trazable', 'F359 Memoria preliminar', 'F360 Beta'].map((label, index) => {
      const x = index * 245;
      return `
      <rect x="${x}" y="0" width="210" height="96" rx="12" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
      <text x="${x + 18}" y="34" font-family="Arial" font-size="16" font-weight="700" fill="#1e3a8a">${label}</text>
      <text x="${x + 18}" y="64" font-family="Arial" font-size="12" fill="#334155">ready</text>
      ${index < 4 ? `<path d="M ${x + 218} 48 L ${x + 238} 48" stroke="#64748b" stroke-width="3"/><path d="M ${x + 238} 48 l-8 -6 v12 z" fill="#64748b"/>` : ''}`;
    }).join('')}
  </g>
  <g transform="translate(54,350)">
    ${rows.map((row, index) => {
      const x = (index % 2) * 600;
      const y = Math.floor(index / 2) * 155;
      const color = row.modalityProfile === 'CY' ? '#2563eb' : row.modalityProfile === 'NM' ? '#16a34a' : '#7c3aed';
      return `
      <rect x="${x}" y="${y}" width="552" height="118" rx="12" fill="#ffffff" stroke="${color}" stroke-width="3"/>
      <text x="${x + 18}" y="${y + 30}" font-family="Arial" font-size="17" font-weight="700" fill="#111827">${row.equipmentLabel}</text>
      <text x="${x + 18}" y="${y + 56}" font-family="Arial" font-size="12" fill="#334155">${row.provider}</text>
      <text x="${x + 18}" y="${y + 82}" font-family="Arial" font-size="12" fill="#334155">Material: ${row.material}; TVL ${row.tvlCm}</text>
      <text x="${x + 18}" y="${y + 104}" font-family="Arial" font-size="12" fill="#b45309">Calculo trazable preliminar, sin espesor firmado</text>`;
    }).join('')}
  </g>
  <g transform="translate(54,690)">
    <rect width="1210" height="72" rx="10" fill="#ecfdf5" stroke="#16a34a"/>
    <text x="20" y="31" font-family="Arial" font-size="16" font-weight="700" fill="#14532d">Decision F360: release beta</text>
    <text x="20" y="56" font-family="Arial" font-size="13" fill="#166534">Uso permitido: prueba real, captura de datos y revision visual. Uso bloqueado: memoria firmada, espesor certificado o dictamen final.</text>
  </g>
</svg>
`;

const betaHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F356-F360 Beta Release</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 1320px; margin: 0 auto; padding: 28px; }
    .banner { border: 2px solid #f97316; background: #fff7ed; color: #9a3412; padding: 12px; border-radius: 8px; font-weight: 700; }
    .panel { background: #fff; border: 1px solid #d8e0ea; border-radius: 8px; padding: 18px; margin: 18px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <main>
    <h1>F356-F360 - Release beta operativo</h1>
    <p class="banner">BETA / NO CERTIFICADO. No produce memoria analitica firmada ni espesores certificados.</p>
    <div class="panel">${visualSvg.replace(/<\?xml[^>]*>\n?/, '')}</div>
    <div class="panel">
      <h2>Checklist de prueba real</h2>
      <table>
        <thead><tr><th>ID</th><th>Paso</th><th>Estado</th><th>Nota</th></tr></thead>
        <tbody>${userTestChecklist.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="panel">
      <h2>Decision beta</h2>
      <p>Uso permitido: ${betaDecision.allowedUse.join(', ')}.</p>
      <p>Uso bloqueado: ${betaDecision.blockedUse.join(', ')}.</p>
    </div>
  </main>
</body>
</html>
`;

const memoriaBeta = `# F359 - Memoria analitica preliminar beta

**Estado:** BETA / NO CERTIFICADO.

Esta memoria preliminar se genera para prueba real de usuario. Integra fuente/proveedor disponible, geometria 1:100, material candidato, TVL/densidad con hash preliminar, penetraciones estandar y calculo trazable sin espesor firmado.

${memoriaSections.map((section) => `## ${section.title}

${section.body.map((line) => `- ${line}`).join('\n')}
- Citas/hashes: ${section.citationIds.join('; ')}
- Advertencias: ${section.warnings.join('; ')}
`).join('\n')}

## Decision F360

Release como beta operativa. No usar para dictamen final ni memoria firmada.
`;

writeCsv(path.join(outDir, 'f356_user_test_checklist.csv'), [
  ['id', 'step', 'status', 'note'],
  ...userTestChecklist,
]);

writeCsv(path.join(outDir, 'f357_missing_data_capture.csv'), [
  ['fieldId', 'field', 'status', 'action'],
  ...missingDataFields,
]);

writeCsv(path.join(outDir, 'f358_traceable_preliminary_calculations.csv'), [
  ['calculationId', 'roomId', 'equipmentLabel', 'formulaId', 'standard', 'signedStatus', 'evidenceHash', 'warnings'],
  ...preliminaryCalculations.map((calc) => [
    calc.calculationId,
    calc.roomId,
    calc.equipmentLabel,
    calc.formulaId,
    calc.standard,
    calc.signedStatus,
    calc.outputs.evidenceHash,
    calc.warnings.join('; '),
  ]),
]);

fs.writeFileSync(path.join(outDir, 'f356_f360_beta_release_visual.svg'), visualSvg, 'utf8');
fs.writeFileSync(path.join(outDir, 'f356_f360_beta_release.html'), betaHtml, 'utf8');
fs.writeFileSync(path.join(outDir, 'f359_memoria_beta_preliminar.md'), memoriaBeta, 'utf8');

const manifest = {
  schema: 'radshield-mx.f356-f360.beta-release.v1',
  phases: ['F356', 'F357', 'F358', 'F359', 'F360'],
  generatedAt: new Date().toISOString(),
  status: 'beta-release-ready-not-certified',
  source: {
    f350Manifest: 'outputs/f350_f355_real_test_package/f350_f355_real_test_package.json',
    f350Status: f350.status,
    f350EvidenceHash: f350.evidenceHash,
  },
  f356UserTestChecklist: userTestChecklist.map(([id, step, status, note]) => ({ id, step, status, note })),
  f357MissingDataCapture: missingDataFields.map(([fieldId, field, status, action]) => ({ fieldId, field, status, action })),
  f358PreliminaryCalculations: preliminaryCalculations,
  f359MemoriaSections: memoriaSections,
  f360BetaDecision: betaDecision,
  signedCalculationProduced: false,
  releaseClassification: 'beta-operativa-no-certificada',
  artifacts: {
    manifest: 'outputs/f356_f360_beta_release/f356_f360_beta_release.json',
    visualSvg: 'outputs/f356_f360_beta_release/f356_f360_beta_release_visual.svg',
    visualHtml: 'outputs/f356_f360_beta_release/f356_f360_beta_release.html',
    userTestChecklist: 'outputs/f356_f360_beta_release/f356_user_test_checklist.csv',
    missingDataCapture: 'outputs/f356_f360_beta_release/f357_missing_data_capture.csv',
    traceableCalculations: 'outputs/f356_f360_beta_release/f358_traceable_preliminary_calculations.csv',
    memoriaBeta: 'outputs/f356_f360_beta_release/f359_memoria_beta_preliminar.md',
    zip: 'outputs/f356_f360_beta_release/radshield_f356_f360_beta_release.zip',
  },
  releaseHash: sha256Text(JSON.stringify({ rows, userTestChecklist, missingDataFields, preliminaryCalculations, memoriaSections, betaDecision })),
  nextRecommendedPhase: 'Beta field test: operator opens app, loads the real plan, completes missing inputs and reports real blockers before any stable release.',
};

fs.writeFileSync(path.join(outDir, 'f356_f360_beta_release.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const zip = new JSZip();
for (const artifactName of [
  'f356_f360_beta_release.json',
  'f356_f360_beta_release_visual.svg',
  'f356_f360_beta_release.html',
  'f356_user_test_checklist.csv',
  'f357_missing_data_capture.csv',
  'f358_traceable_preliminary_calculations.csv',
  'f359_memoria_beta_preliminar.md',
]) {
  zip.file(artifactName, fs.readFileSync(path.join(outDir, artifactName)));
}
fs.writeFileSync(
  path.join(outDir, 'radshield_f356_f360_beta_release.zip'),
  await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }),
);

const summary = `# F356-F360 - Release beta operativo

Estado: \`${manifest.status}\`

F356-F360 cierra la estabilizacion actual como beta operativa:

- F356: checklist de prueba real de usuario.
- F357: captura de datos faltantes.
- F358: calculo preliminar trazable sin espesor firmado.
- F359: memoria preliminar beta.
- F360: decision formal de release beta no certificado.

No se produce calculo firmado: \`${manifest.signedCalculationProduced}\`.

Artefacto visual: \`${manifest.artifacts.visualHtml}\`

ZIP beta: \`${manifest.artifacts.zip}\`
`;

fs.writeFileSync(path.join(root, 'outputs', 'fase_356_360_beta_release.md'), summary, 'utf8');

console.log('F356-F360 beta release package generated.');
