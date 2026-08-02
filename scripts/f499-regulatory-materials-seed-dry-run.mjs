import fs from 'node:fs';
import path from 'node:path';

if (process.env.F499_SEED_LIVE === '1') {
  console.error('F499 is dry-run only. Live DB writes are intentionally blocked; use F500 after review/restore probe.');
  process.exit(1);
}

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f499_regulatory_materials_seed_dry_run');
fs.mkdirSync(outDir, { recursive: true });

const source = fs.readFileSync(path.join(root, 'src', 'lib', 'materialDatabase.ts'), 'utf8');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const idSafe = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
const hashText = (value) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const stringField = (block, field) => block.match(new RegExp(`${field}:\\s*'([^']*)'`))?.[1] ?? '';
const numberField = (block, field) => {
  const raw = block.match(new RegExp(`${field}:\\s*([0-9]+(?:\\.[0-9]+)?)`))?.[1];
  return raw ? Number(raw) : null;
};
const boolField = (block, field) => block.match(new RegExp(`${field}:\\s*true`)) !== null;
const arrayField = (block, field) => {
  const raw = block.match(new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`))?.[1] ?? '';
  return [...raw.matchAll(/'([^']+)'/g)].map((match) => match[1]);
};
const objectNumberField = (block, field) => {
  const raw = block.match(new RegExp(`${field}:\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const entries = {};
  for (const match of raw.matchAll(/'([^']+)':\s*(null|[0-9]+(?:\.[0-9]+)?)/g)) {
    entries[match[1]] = match[2] === 'null' ? null : Number(match[2]);
  }
  return entries;
};
const neutronField = (block) => {
  const raw = block.match(/TVL_neutron_cm:\s*\{([^}]*)\}/)?.[1];
  if (!raw) return null;
  return {
    TVL1: Number(raw.match(/TVL1:\s*([0-9]+(?:\.[0-9]+)?)/)?.[1] ?? 0),
    TVLe: Number(raw.match(/TVLe:\s*([0-9]+(?:\.[0-9]+)?)/)?.[1] ?? 0),
  };
};

const blocks = [...source.matchAll(/\{\s*id:\s*'[^']+'[\s\S]*?\n\s*\},/g)].map((match) => match[0]);
const materials = blocks.map((block) => {
  const id = stringField(block, 'id');
  const name = stringField(block, 'name');
  const category = stringField(block, 'category');
  const manufacturer = stringField(block, 'manufacturer');
  const normativa = arrayField(block, 'normativa');
  const isNCRP151 = boolField(block, 'isNCRP151');
  const reviewState = isNCRP151 ? 'approved-reference' : manufacturer || /verishield|nipoll|nelco|v-|block|bloque/i.test(`${id} ${name}`) ? 'review-required' : 'candidate';
  const allowedUses = reviewState === 'approved-reference' ? ['calculation', 'report-evidence', 'structural-cost'] : ['report-evidence', 'structural-cost', 'visual-only'];
  return {
    id,
    name,
    category,
    manufacturer,
    density_g_cm3: numberField(block, 'density_g_cm3') ?? 0,
    normativa,
    isNCRP151,
    reviewState,
    allowedUses,
    TVL_primary_cm: objectNumberField(block, 'TVL_primary_cm'),
    TVL_secondary_cm: objectNumberField(block, 'TVL_secondary_cm'),
    TVL_neutron_cm: neutronField(block),
    thickness_mm_std: arrayField(block, 'thickness_mm_std').map(Number).filter(Number.isFinite),
    cost_MXN_m2_approx: numberField(block, 'cost_MXN_m2_approx'),
    sourceId: isNCRP151 ? `src-norm-${id}` : `src-material-${id}`,
    sourceStatus: isNCRP151 ? 'approved-reference' : manufacturer ? 'review-required' : 'candidate',
  };
}).filter((item) => item.id && item.name);

const governanceSources = [
  ['ncrp-151-mv-radiotherapy', 'NCRP 151 / LINAC shielding governance', 'normative', 1, 'approved-reference'],
  ['ncrp-147-diagnostic', 'NCRP 147 Diagnostic shielding governance', 'normative', 1, 'approved-reference'],
  ['iaea-srs-47-radiotherapy', 'IAEA SRS-47 Radiotherapy Facilities', 'normative', 2, 'approved-reference'],
  ['aapm-tg108-pet-nm', 'AAPM TG-108 PET/NM shielding support', 'normative', 2, 'approved-reference'],
  ['uaq-local-review', 'UAQ/CNSNS local review and memory acceptance', 'analytic-memory', 3, 'candidate'],
  ['tm-nipoll-contuplex-materials', 'TM NIPOLL / CONTUPLEX material evidence', 'lab', 6, 'review-required'],
].map(([id, title, authority, canonicalRank, reviewState]) => ({
  id,
  title,
  authority,
  canonicalRank: Number(canonicalRank),
  documentHash: hashText(`${id}|${title}`),
  pageRef: 'document_chunks.page_ref required for live DB',
  reviewState,
  allowedUses: authority === 'normative' ? 'calculation|report-evidence' : 'report-evidence|visual-only',
  notes: 'F499 dry-run source row; verify page/hash against document_chunks before F500 live seed.',
}));

const materialSources = materials.map((material) => ({
  id: material.sourceId,
  title: `${material.name} - ${material.normativa.join(', ') || 'material evidence'}`,
  authority: material.manufacturer ? 'vendor' : material.isNCRP151 ? 'normative' : 'derived',
  canonicalRank: material.isNCRP151 ? 1 : material.manufacturer ? 4 : 5,
  documentHash: hashText(`${material.id}|${material.name}|${material.normativa.join('|')}`),
  pageRef: material.isNCRP151 ? 'NCRP/IAEA material table reference' : 'pending-page-ref',
  reviewState: material.sourceStatus,
  allowedUses: material.allowedUses.join('|'),
  notes: material.isNCRP151 ? 'Reference material can be used in preliminary calculations with formula trace.' : 'Promote only after source/page/hash/value review and professional approval.',
}));

const regulatorySources = [...governanceSources, ...materialSources];

const materialConstants = materials.map((material) => ({
  id: material.id,
  name: material.name,
  category: material.category,
  manufacturer: material.manufacturer,
  density_g_cm3: material.density_g_cm3,
  densityState: material.reviewState,
  reviewState: material.reviewState,
  allowedUses: material.allowedUses.join('|'),
  warnings: [
    ...(material.reviewState !== 'approved-reference' ? ['Material value is not promoted to controlled calculation constant.'] : []),
    ...(!material.isNCRP151 ? ['Requires source/page/hash review before final memoria analitica.'] : []),
    ...(material.manufacturer ? ['Vendor data is evidence until approved by physicist/RSO and project specification.'] : []),
  ].join(' | '),
}));

const materialValueVersions = materials.flatMap((material) => {
  const baseId = idSafe(material.id);
  const reviewState = material.reviewState === 'approved-reference' ? 'approved-reference' : 'review-required';
  const allowedUse = material.reviewState === 'approved-reference' ? 'calculation' : 'report-evidence';
  const rows = [{
    id: `${baseId}-density-g-cm3`,
    materialId: material.id,
    valueKind: 'density',
    energyKey: 'bulk',
    value: material.density_g_cm3,
    unit: 'g/cm3',
    sourceId: material.sourceId,
    reviewState,
    allowedUse,
  }];
  for (const [energyKey, value] of Object.entries(material.TVL_primary_cm)) {
    if (typeof value === 'number') rows.push({ id: `${baseId}-tvl-primary-${idSafe(energyKey)}`, materialId: material.id, valueKind: 'tvl-primary', energyKey, value, unit: 'cm', sourceId: material.sourceId, reviewState, allowedUse });
  }
  for (const [energyKey, value] of Object.entries(material.TVL_secondary_cm)) {
    if (typeof value === 'number') rows.push({ id: `${baseId}-tvl-secondary-${idSafe(energyKey)}`, materialId: material.id, valueKind: 'tvl-secondary', energyKey, value, unit: 'cm', sourceId: material.sourceId, reviewState, allowedUse });
  }
  if (material.TVL_neutron_cm) {
    rows.push({ id: `${baseId}-tvl-neutron-tvl1`, materialId: material.id, valueKind: 'tvl-neutron', energyKey: 'TVL1', value: material.TVL_neutron_cm.TVL1, unit: 'cm', sourceId: material.sourceId, reviewState, allowedUse });
    rows.push({ id: `${baseId}-tvl-neutron-tvle`, materialId: material.id, valueKind: 'tvl-neutron', energyKey: 'TVLe', value: material.TVL_neutron_cm.TVLe, unit: 'cm', sourceId: material.sourceId, reviewState, allowedUse });
  }
  if (typeof material.cost_MXN_m2_approx === 'number') {
    rows.push({ id: `${baseId}-cost-mxn-m2`, materialId: material.id, valueKind: 'cost', energyKey: 'commercial', value: material.cost_MXN_m2_approx, unit: 'MXN/m2', sourceId: material.sourceId, reviewState: 'review-required', allowedUse: 'structural-cost' });
  }
  material.thickness_mm_std.forEach((thickness) => {
    rows.push({ id: `${baseId}-thickness-standard-${thickness}`, materialId: material.id, valueKind: 'thickness-standard', energyKey: 'commercial', value: thickness, unit: 'mm', sourceId: material.sourceId, reviewState: 'review-required', allowedUse: 'structural-cost' });
  });
  return rows;
});

const materialSourceLinks = materials.flatMap((material) => material.allowedUses.map((allowedUse) => ({
  materialId: material.id,
  sourceId: material.sourceId,
  allowedUse,
  reviewState: material.reviewState,
})));

const seed = {
  schema: 'radshield-mx.db.regulatory-materials.seed.f499.v1',
  phase: 'F499',
  status: 'dry-run-ready',
  liveWriteBlocked: true,
  generatedAt: new Date().toISOString(),
  counts: {
    regulatorySources: regulatorySources.length,
    materialConstants: materialConstants.length,
    materialValueVersions: materialValueVersions.length,
    materialSourceLinks: materialSourceLinks.length,
    approvedCalculationValueVersions: materialValueVersions.filter((row) => row.reviewState === 'approved-reference' && row.allowedUse === 'calculation').length,
    reviewRequiredValueVersions: materialValueVersions.filter((row) => row.reviewState !== 'approved-reference').length,
  },
  reviewQueue: [
    'Review pending-page-ref sources before live seed.',
    'Promote vendor/lab material constants only after source/page/hash/value approval.',
    'Run duplicate review against document_chunks before F500 live readback.',
    'Repeat F484-F490 after DB seed/readback.',
  ],
  rows: { regulatorySources, materialConstants, materialValueVersions, materialSourceLinks },
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const writeJsonl = (fileName, rows) => fs.writeFileSync(path.join(outDir, fileName), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
const writeCsv = (fileName, rows) => {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const lines = headers.length ? [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))] : [];
  fs.writeFileSync(path.join(outDir, fileName), `${lines.join('\n')}${lines.length ? '\n' : ''}`, 'utf8');
};
const sqlString = (value) => `'${String(value ?? '').replace(/'/g, "''")}'`;
const sqlNumber = (value) => (Number.isFinite(value) ? String(value) : 'NULL');
const sqlLines = [
  '-- F499 dry-run only. Review before F500 live seed.',
  '-- Tables must exist before executing these INSERT drafts.',
  ...regulatorySources.map((row) => `INSERT INTO regulatory_sources (id,title,authority,canonical_rank,document_hash,page_ref,review_state,allowed_uses,notes) VALUES (${sqlString(row.id)},${sqlString(row.title)},${sqlString(row.authority)},${sqlNumber(row.canonicalRank)},${sqlString(row.documentHash)},${sqlString(row.pageRef)},${sqlString(row.reviewState)},${sqlString(row.allowedUses)},${sqlString(row.notes)});`),
  ...materialConstants.map((row) => `INSERT INTO material_constants (id,name,category,manufacturer,density_g_cm3,density_state,review_state,allowed_uses,warnings) VALUES (${sqlString(row.id)},${sqlString(row.name)},${sqlString(row.category)},${sqlString(row.manufacturer)},${sqlNumber(row.density_g_cm3)},${sqlString(row.densityState)},${sqlString(row.reviewState)},${sqlString(row.allowedUses)},${sqlString(row.warnings)});`),
  ...materialValueVersions.map((row) => `INSERT INTO material_value_versions (id,material_id,value_kind,energy_key,value,unit,source_id,review_state,allowed_use) VALUES (${sqlString(row.id)},${sqlString(row.materialId)},${sqlString(row.valueKind)},${sqlString(row.energyKey)},${sqlNumber(row.value)},${sqlString(row.unit)},${sqlString(row.sourceId)},${sqlString(row.reviewState)},${sqlString(row.allowedUse)});`),
  ...materialSourceLinks.map((row) => `INSERT INTO material_source_links (material_id,source_id,allowed_use,review_state) VALUES (${sqlString(row.materialId)},${sqlString(row.sourceId)},${sqlString(row.allowedUse)},${sqlString(row.reviewState)});`),
  '',
];
const markdown = [
  '# F499 SEED DRY-RUN DB REGULATORIA/MATERIALES',
  '',
  `Fuentes: ${seed.counts.regulatorySources}`,
  `Materiales: ${seed.counts.materialConstants}`,
  `Versiones de valores: ${seed.counts.materialValueVersions}`,
  `Links material-fuente: ${seed.counts.materialSourceLinks}`,
  `Valores aprobados para calculo: ${seed.counts.approvedCalculationValueVersions}`,
  `Valores en revision: ${seed.counts.reviewRequiredValueVersions}`,
  '',
  '## Cola de revision',
  ...seed.reviewQueue.map((item) => `- ${item}`),
  '',
].join('\n');

writeJsonl('f499_regulatory_sources.jsonl', regulatorySources);
writeJsonl('f499_material_constants.jsonl', materialConstants);
writeJsonl('f499_material_value_versions.jsonl', materialValueVersions);
writeJsonl('f499_material_source_links.jsonl', materialSourceLinks);
writeCsv('f499_regulatory_sources.csv', regulatorySources);
writeCsv('f499_material_constants.csv', materialConstants);
writeCsv('f499_material_value_versions.csv', materialValueVersions);
writeCsv('f499_material_source_links.csv', materialSourceLinks);
fs.writeFileSync(path.join(outDir, 'f499_seed_dry_run.sql'), sqlLines.join('\n'), 'utf8');
fs.writeFileSync(path.join(outDir, 'f499_seed_dry_run.md'), `${markdown}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f499_seed_manifest.json'), `${JSON.stringify(seed, null, 2)}\n`, 'utf8');

console.log(`F499 regulatory/material seed dry-run generated. sources=${seed.counts.regulatorySources} materials=${seed.counts.materialConstants} valueVersions=${seed.counts.materialValueVersions} links=${seed.counts.materialSourceLinks} out=${path.relative(root, outDir)}`);
