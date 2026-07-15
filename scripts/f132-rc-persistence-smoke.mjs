import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required for F132 persistence smoke.');
  process.exit(1);
}

const outputDir = 'outputs';
fs.mkdirSync(outputDir, { recursive: true });

const userId = 'f132-rc-smoke';
const planKey = 'f132-rc-smoke-controlled-zone';
const exportId = 'f132-rc-smoke-export';
const snapshotId = 'f132-rc-smoke-controlled-zone:analytic-memory:2026-07-14T12:00:00.000Z';
const now = new Date();
const reportHash = crypto
  .createHash('sha256')
  .update('F132 RadShield-MX RC persistence evidence export')
  .digest('hex');

const checks = [];
let ids = {};
let connection;

function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok, ...detail });
}

async function countOne(sql, params) {
  const [rows] = await connection.execute(sql, params);
  return Number(rows[0]?.count ?? 0);
}

try {
  connection = await mysql.createConnection(databaseUrl);
  await connection.beginTransaction();

  await connection.execute('delete from project_report_exports where export_id = ?', [exportId]);
  await connection.execute('delete from analytic_memory_snapshots where snapshot_id = ?', [snapshotId]);
  await connection.execute('delete from controlled_zone_calculations where plan_key = ?', [planKey]);
  await connection.execute('delete from controlled_zone_plans where plan_key = ?', [planKey]);
  await connection.execute('delete from audit_trail where userId = ?', [userId]);
  await connection.execute('delete from reports where userId = ?', [userId]);
  await connection.execute('delete from calculations where userId = ?', [userId]);
  await connection.execute('delete from projects where userId = ?', [userId]);
  await connection.execute('delete from users where unionId = ?', [userId]);

  await connection.execute(
    `insert into users (unionId, name, email, role, lastSignInAt)
     values (?, ?, ?, ?, ?)`,
    [userId, 'F132 RC Smoke User', 'f132@radshield.local', 'admin', now],
  );
  addCheck('insert:user', true, { userId });

  const floorPlan = {
    schemaVersion: 'radshield-floorplan-rc-v1',
    layout: { widthM: 9.2, heightM: 8.4, scale: '1 px = 0.01 m' },
    rooms: [{ id: 'bunker', name: 'LINAC bunker F132', widthM: 8.4, heightM: 7.6 }],
    controlledZones: [{ id: 'cz-1', label: 'Zona controlada', color: '#f97316' }],
    barriers: [
      { id: 'north-wall', material: 'high_density_concrete', thicknessMm: 1850 },
      { id: 'door', material: 'lead', thicknessMm: 18 },
    ],
    equipment: [{ id: 'linac-1', type: 'LINAC', vendor: 'Generic', energy: '15 MV', isocenter: { x: 4.1, y: 3.8 } }],
  };

  const [projectResult] = await connection.execute(
    `insert into projects
      (userId, name, description, floorPlanJson, version, modality, numSources, numBarriers, maxKerma)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'F132 RC full-stack persistence bunker',
      'Release-candidate persistence smoke for project, floorplan, calculation, report and evidence.',
      JSON.stringify(floorPlan),
      '132.0',
      'LINAC',
      '1',
      '2',
      'pending',
    ],
  );
  const projectId = Number(projectResult.insertId);
  ids.projectId = projectId;
  addCheck('insert:project', projectId > 0, { projectId });

  const parameters = {
    standard: 'NCRP 151',
    workloadGyWeek: 500,
    designGoal_mSvWeek: 0.02,
    distanceM: 6.2,
    occupancyFactor: 0.25,
    useFactor: 0.25,
    source: 'F132 smoke',
  };
  const results = {
    material: 'high_density_concrete',
    requiredThicknessMm: 1850,
    transmission: 0.00012,
    status: 'pass',
    formulaLedger: ['B = P d^2 / (W U T)', 'n = -log10(B)', 't = TVL1 + (n - 1) TVLe'],
    citations: ['NCRP 151 structural shielding design workflow', 'RadShield F125 calculation evidence gate'],
  };

  const [calculationResult] = await connection.execute(
    `insert into calculations
      (userId, type, equipment, modality, energy, parametersJson, resultsJson, materialId, passes)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'ncrp151',
      'LINAC',
      'LINAC',
      '15 MV',
      JSON.stringify(parameters),
      JSON.stringify(results),
      'high_density_concrete',
      'pass',
    ],
  );
  ids.calculationId = Number(calculationResult.insertId);
  addCheck('insert:calculation', ids.calculationId > 0, { calculationId: ids.calculationId });

  const reportContent = [
    '# Memoria analitica F132',
    '',
    'Proyecto de prueba RC con trazabilidad completa.',
    'Formula: B = P d^2 / (W U T).',
    'Resultado: barrera norte con concreto alta densidad, 1850 mm.',
  ].join('\n');

  const [reportResult] = await connection.execute(
    `insert into reports
      (userId, title, installation, equipment, modality, content, format, projectId)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'F132 memoria analitica RC',
      'RadShield-MX RC Lab',
      'LINAC 15 MV',
      'LINAC',
      reportContent,
      'txt',
      String(projectId),
    ],
  );
  ids.reportId = Number(reportResult.insertId);
  addCheck('insert:report', ids.reportId > 0, { reportId: ids.reportId });

  await connection.execute(
    `insert into controlled_zone_plans
      (plan_key, project_id, user_id, option_id, option_name, modality, schema_version, generated_at, profile_json, assumptions_json, summary_json, missing_inputs_json)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      planKey,
      String(projectId),
      userId,
      'f132-option-a',
      'LINAC controlled-zone RC option',
      'LINAC',
      'radshield-controlled-zone-db-draft-v1',
      now,
      JSON.stringify({ modality: 'LINAC', equipment: 'LINAC 15 MV', floorplanSource: 'F132' }),
      JSON.stringify(parameters),
      JSON.stringify({ status: 'pass', barriers: 2, maxRequiredThicknessMm: 1850 }),
      JSON.stringify([]),
    ],
  );
  addCheck('insert:controlled-zone-plan', true, { planKey });

  const controlledCalculations = [
    ['north-wall', 'controlled', 'primary-barrier', 'ncrp151-primary', 6.2, 0.25, 0.02, 480, 1850, 'high_density_concrete', 'pass', 1],
    ['door', 'controlled', 'door-shielding', 'ncrp151-door', 7.1, 0.125, 0.02, 75, 18, 'lead', 'warning', 2],
  ];
  for (const [barrier, adjacentZone, family, method, distance, occupancy, designGoal, unshielded, thickness, material, status, sortOrder] of controlledCalculations) {
    await connection.execute(
      `insert into controlled_zone_calculations
        (plan_key, seed_id, barrier, adjacent_zone, calculation_family, method, distance_m, occupancy_factor, design_goal_msv_week, unshielded_msv_week, required_thickness_mm, material_code, status, sort_order, notes_json)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planKey,
        `f132-${barrier}`,
        barrier,
        adjacentZone,
        family,
        method,
        distance,
        occupancy,
        designGoal,
        unshielded,
        thickness,
        material,
        status,
        sortOrder,
        JSON.stringify(['F132 RC persistence smoke', 'Requires clinical QA before production use']),
      ],
    );
  }
  addCheck('insert:controlled-zone-calculations', true, { count: controlledCalculations.length });

  await connection.execute(
    `insert into analytic_memory_snapshots
      (snapshot_id, project_id, plan_key, user_id, format, status, content_json, evidence_links_json)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snapshotId,
      String(projectId),
      planKey,
      userId,
      'markdown',
      'draft',
      JSON.stringify({
        markdown: reportContent,
        calculationId: ids.calculationId,
        reportId: ids.reportId,
        formulas: results.formulaLedger,
      }),
      JSON.stringify([
        { type: 'calculation', id: ids.calculationId },
        { type: 'report', id: ids.reportId },
        { type: 'controlledZonePlan', id: planKey },
      ]),
    ],
  );
  addCheck('insert:analytic-memory-snapshot', true, { snapshotId });

  await connection.execute(
    `insert into project_report_exports
      (export_id, project_id, plan_key, user_id, report_type, file_name, mime_type, hash_sha256, metadata_json)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exportId,
      String(projectId),
      planKey,
      userId,
      'memoria-analitica',
      'f132-memoria-analitica-rc.txt',
      'text/plain',
      reportHash,
      JSON.stringify({ reportId: ids.reportId, calculationId: ids.calculationId, phase: 'F132' }),
    ],
  );
  addCheck('insert:project-report-export', true, { exportId, hashSha256: reportHash });

  await connection.execute(
    `insert into audit_trail (userId, projectId, action, fieldName, oldValue, newValue, ipAddress, userAgent)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      String(projectId),
      'generate_report',
      'f132_rc_persistence',
      null,
      JSON.stringify({ planKey, reportId: ids.reportId, exportId }),
      '127.0.0.1',
      'RadShield F132 smoke',
    ],
  );
  addCheck('insert:audit-trail', true, { action: 'generate_report' });

  await connection.execute('update projects set maxKerma = ? where id = ? and userId = ?', [
    '0.018 mSv/week',
    projectId,
    userId,
  ]);
  await connection.execute('update reports set content = ? where id = ? and userId = ?', [
    `${reportContent}\n\nActualizacion F132: persistencia verificada.`,
    ids.reportId,
    userId,
  ]);
  addCheck('update:project-and-report', true, { projectId, reportId: ids.reportId });

  const readbackChecks = [
    ['readback:user', 'select count(*) as count from users where unionId = ?', [userId], 1],
    ['readback:project', 'select count(*) as count from projects where id = ? and maxKerma = ?', [projectId, '0.018 mSv/week'], 1],
    ['readback:calculation', 'select count(*) as count from calculations where id = ? and passes = ?', [ids.calculationId, 'pass'], 1],
    ['readback:report', 'select count(*) as count from reports where id = ? and content like ?', [ids.reportId, '%persistencia verificada%'], 1],
    ['readback:controlled-zone-plan', 'select count(*) as count from controlled_zone_plans where plan_key = ?', [planKey], 1],
    ['readback:controlled-zone-calculations', 'select count(*) as count from controlled_zone_calculations where plan_key = ?', [planKey], 2],
    ['readback:analytic-memory', 'select count(*) as count from analytic_memory_snapshots where snapshot_id = ?', [snapshotId], 1],
    ['readback:report-export', 'select count(*) as count from project_report_exports where export_id = ? and hash_sha256 = ?', [exportId, reportHash], 1],
    ['readback:audit', 'select count(*) as count from audit_trail where userId = ? and action = ?', [userId, 'generate_report'], 1],
  ];

  for (const [name, sql, params, min] of readbackChecks) {
    const count = await countOne(sql, params);
    addCheck(name, count >= min, { count, min });
  }

  const joinedEvidenceCount = await countOne(
    `select count(*) as count
     from controlled_zone_plans p
     join controlled_zone_calculations c on c.plan_key = p.plan_key
     join analytic_memory_snapshots m on m.plan_key = p.plan_key
     join project_report_exports e on e.plan_key = p.plan_key
     where p.plan_key = ? and p.project_id = ?`,
    [planKey, String(projectId)],
  );
  addCheck('readback:joined-evidence-chain', joinedEvidenceCount >= 2, { count: joinedEvidenceCount, min: 2 });

  await connection.commit();
} catch (error) {
  await connection?.rollback();
  addCheck('transaction', false, { error: error instanceof Error ? error.message : String(error) });
} finally {
  await connection?.end();
}

const ok = checks.every((check) => check.ok);
const output = {
  phase: 'F132',
  generatedAt: new Date().toISOString(),
  status: ok ? 'ready' : 'blocked',
  userId,
  planKey,
  exportId,
  snapshotId,
  ids,
  checks,
  blockers: checks.filter((check) => !check.ok).map((check) => check.name),
  decision: ok
    ? 'F132 persistence chain is ready for API-authenticated release-candidate smoke.'
    : 'F132 persistence chain failed; inspect blockers before proceeding.',
};

fs.writeFileSync(`${outputDir}/f132_rc_persistence_smoke.json`, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(
  `${outputDir}/fase_132_rc_persistence_smoke.md`,
  [
    '# F132 RC Persistence Smoke',
    '',
    `Generated: ${output.generatedAt}`,
    `Status: ${output.status}`,
    `User: ${userId}`,
    `Project ID: ${ids.projectId ?? 'n/a'}`,
    `Plan key: ${planKey}`,
    `Export ID: ${exportId}`,
    '',
    '## Checks',
    ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}`),
    '',
    '## Decision',
    output.decision,
    '',
  ].join('\n'),
);

console.log(JSON.stringify(output, null, 2));
if (!ok) process.exitCode = 1;
