import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as jose from 'jose';
import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required for F133 API authenticated smoke.');
  process.exit(1);
}

const outputDir = 'outputs';
fs.mkdirSync(outputDir, { recursive: true });

const appBundle = path.resolve('dist-backend/server/boot.js');
if (!fs.existsSync(appBundle)) {
  console.error(`Backend bundle not found: ${appBundle}`);
  process.exit(1);
}

const app = (await import(pathToFileURL(appBundle).href)).default;
const userId = 'f133-api-smoke';
const spoofedUserId = 'f133-spoofed-user';
const planKey = 'f133-api-smoke-controlled-zone';
const exportId = 'f133-api-smoke-export';
const generatedAt = '2026-07-14T13:00:00.000Z';
const reportHash = crypto.createHash('sha256').update('F133 authenticated API smoke export').digest('hex');
const checks = [];
const ids = {};
let connection;

function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok, ...detail });
}

async function countOne(sql, params) {
  const [rows] = await connection.execute(sql, params);
  return Number(rows[0]?.count ?? 0);
}

function trpcUrl(procedure, input) {
  const url = new URL(`http://local/api/trpc/${procedure}`);
  if (input !== undefined) {
    url.searchParams.set('input', JSON.stringify({ json: input }));
  }
  return url.toString();
}

function unwrapTrpcJson(body) {
  return body?.result?.data?.json;
}

async function makeSessionCookie() {
  const secret = new TextEncoder().encode(process.env.APP_SECRET ?? '');
  const token = await new jose.SignJWT({ unionId: userId, clientId: process.env.APP_ID || 'f133-local-client' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
  return `kimi_sid=${token}`;
}

async function trpcCall(procedure, input, cookieHeader, method = 'POST') {
  const isGet = method === 'GET';
  const response = await app.fetch(
    new Request(isGet ? trpcUrl(procedure, input) : trpcUrl(procedure), {
      method,
      headers: {
        ...(!isGet ? { 'content-type': 'application/json' } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: isGet ? undefined : JSON.stringify({ json: input ?? null }),
    }),
  );
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, text };
}

function assertTrpcOk(name, result) {
  const ok = result.status === 200 && !result.body?.error;
  addCheck(`api:${name}`, ok, {
    status: result.status,
    errorCode: result.body?.error?.json?.data?.code,
  });
  if (!ok) {
    throw new Error(`${name} failed: ${result.status} ${result.text}`);
  }
  return unwrapTrpcJson(result.body);
}

try {
  connection = await mysql.createConnection(databaseUrl);

  await connection.execute('delete from project_report_exports where export_id = ?', [exportId]);
  await connection.execute('delete from analytic_memory_snapshots where snapshot_id = ?', [
    `${planKey}:analytic-memory:${generatedAt}`,
  ]);
  await connection.execute('delete from controlled_zone_calculations where plan_key = ?', [planKey]);
  await connection.execute('delete from controlled_zone_plans where plan_key = ?', [planKey]);
  await connection.execute('delete from audit_trail where userId in (?, ?)', [userId, spoofedUserId]);
  await connection.execute('delete from reports where userId in (?, ?)', [userId, spoofedUserId]);
  await connection.execute('delete from calculations where userId in (?, ?)', [userId, spoofedUserId]);
  await connection.execute('delete from projects where userId in (?, ?)', [userId, spoofedUserId]);
  await connection.execute('delete from users where unionId in (?, ?)', [userId, spoofedUserId]);
  addCheck('cleanup:f133-owned-rows', true, { userId, spoofedUserId });

  await connection.execute(
    `insert into users (unionId, name, email, role, lastSignInAt)
     values (?, ?, ?, ?, ?)`,
    [userId, 'F133 API Smoke User', 'f133@radshield.local', 'admin', new Date()],
  );
  addCheck('seed:authenticated-user', true, { userId });

  const unauth = await trpcCall('project.list', { userId }, null, 'GET');
  const unauthOk = unauth.status === 401 && unauth.body?.error?.json?.data?.code === 'UNAUTHORIZED';
  addCheck('security:unauthenticated-project-list-401', unauthOk, {
    status: unauth.status,
    code: unauth.body?.error?.json?.data?.code,
  });
  if (!unauthOk) throw new Error(`Expected unauthenticated project.list 401, got ${unauth.status}`);

  const cookieHeader = await makeSessionCookie();
  const me = assertTrpcOk('auth.me', await trpcCall('auth.me', undefined, cookieHeader, 'GET'));
  addCheck('auth:session-user', me?.unionId === userId, { unionId: me?.unionId });

  const floorPlan = {
    schemaVersion: 'radshield-api-floorplan-rc-v1',
    rooms: [{ id: 'bunker', name: 'F133 API bunker', widthM: 8.8, heightM: 7.2 }],
    barriers: [
      { id: 'north-wall', material: 'tm_nipoll', thicknessMm: 1450 },
      { id: 'maze-door', material: 'lead', thicknessMm: 16 },
    ],
    equipment: [{ id: 'linac-api', type: 'LINAC', energy: '15 MV' }],
  };

  const createdProject = assertTrpcOk(
    'project.create',
    await trpcCall(
      'project.create',
      {
        userId: spoofedUserId,
        name: 'F133 API authenticated bunker',
        description: 'Created through authenticated tRPC API smoke.',
        floorPlanJson: JSON.stringify(floorPlan),
        version: '133.0',
        modality: 'LINAC',
        numSources: '1',
        numBarriers: '2',
        maxKerma: 'pending',
      },
      cookieHeader,
    ),
  );
  ids.projectId = Number(createdProject?.id);
  addCheck('api-result:project-id', ids.projectId > 0, { projectId: ids.projectId });

  const project = assertTrpcOk(
    'project.get',
    await trpcCall('project.get', { id: ids.projectId, userId: spoofedUserId }, cookieHeader, 'GET'),
  );
  addCheck('ownership:project-forced-to-session-user', project?.userId === userId, {
    projectUserId: project?.userId,
  });

  assertTrpcOk(
    'project.update',
    await trpcCall(
      'project.update',
      {
        id: ids.projectId,
        userId: spoofedUserId,
        maxKerma: '0.017 mSv/week',
        description: 'F133 update through authenticated API.',
      },
      cookieHeader,
    ),
  );

  const createdCalculation = assertTrpcOk(
    'calculation.create',
    await trpcCall(
      'calculation.create',
      {
        type: 'ncrp151',
        equipment: 'LINAC',
        modality: 'LINAC',
        energy: '15 MV',
        parametersJson: JSON.stringify({
          standard: 'NCRP 151',
          workloadGyWeek: 520,
          designGoal_mSvWeek: 0.02,
          distanceM: 6.5,
          occupancyFactor: 0.25,
          useFactor: 0.25,
        }),
        resultsJson: JSON.stringify({
          material: 'tm_nipoll',
          requiredThicknessMm: 1450,
          status: 'pass',
          evidence: ['F133 API smoke', 'Formula ledger present'],
        }),
        materialId: 'tm_nipoll',
        passes: 'pass',
      },
      cookieHeader,
    ),
  );
  ids.calculationId = Number(createdCalculation?.id);
  addCheck('api-result:calculation-id', ids.calculationId > 0, { calculationId: ids.calculationId });

  const calculation = assertTrpcOk(
    'calculation.getById',
    await trpcCall('calculation.getById', { id: ids.calculationId }, cookieHeader, 'GET'),
  );
  addCheck('ownership:calculation-forced-to-session-user', calculation?.userId === userId, {
    calculationUserId: calculation?.userId,
  });

  const stats = assertTrpcOk('calculation.stats', await trpcCall('calculation.stats', undefined, cookieHeader, 'GET'));
  addCheck('api-result:calculation-stats', Number(stats?.total ?? 0) >= 1, { total: stats?.total });

  const createdReport = assertTrpcOk(
    'report.create',
    await trpcCall(
      'report.create',
      {
        title: 'F133 memoria API',
        installation: 'RadShield-MX API RC Lab',
        equipment: 'LINAC 15 MV',
        modality: 'LINAC',
        content: 'Memoria API F133: formula, norma, inputs, outputs y evidencia.',
        format: 'txt',
        projectId: String(ids.projectId),
      },
      cookieHeader,
    ),
  );
  ids.reportId = Number(createdReport?.id);
  addCheck('api-result:report-id', ids.reportId > 0, { reportId: ids.reportId });

  assertTrpcOk(
    'report.update',
    await trpcCall(
      'report.update',
      {
        id: ids.reportId,
        content: 'Memoria API F133 actualizada: persistencia y evidencia verificadas.',
      },
      cookieHeader,
    ),
  );
  const report = assertTrpcOk('report.getById', await trpcCall('report.getById', { id: ids.reportId }, cookieHeader, 'GET'));
  addCheck('ownership:report-forced-to-session-user', report?.userId === userId, { reportUserId: report?.userId });

  const draft = {
    schemaVersion: 'radshield-controlled-zone-db-draft-v1',
    generatedAt,
    planKey,
    plan: {
      optionId: 'f133-option-a',
      optionName: 'F133 API controlled-zone option',
      modality: 'LINAC',
      generatedAt,
      profile: { modality: 'LINAC', equipment: 'LINAC 15 MV', apiSmoke: true },
      assumptions: { workloadGyWeek: 520, occupancyFactor: 0.25, designGoal_mSvWeek: 0.02 },
      summary: { status: 'pass', barriers: 2, maxRequiredThicknessMm: 1450 },
      analyticMemoryDraft: 'F133 API memory draft with plan, calculations and export evidence.',
      missingInputs: [],
    },
    calculations: [
      {
        planKey,
        seedId: 'f133-north-wall',
        barrier: 'north-wall',
        adjacentZone: 'controlled',
        calculationFamily: 'primary-barrier',
        method: 'ncrp151-primary',
        distance_m: 6.5,
        occupancyFactor: 0.25,
        designGoal_mSvWeek: 0.02,
        unshielded_mSvWeek: 500,
        requiredThickness_mm: 1450,
        materialCode: 'tm_nipoll',
        status: 'pass',
        notes: ['F133 API smoke'],
        sortOrder: 1,
      },
      {
        planKey,
        seedId: 'f133-door',
        barrier: 'maze-door',
        adjacentZone: 'supervised',
        calculationFamily: 'door-shielding',
        method: 'ncrp151-door',
        distance_m: 7.3,
        occupancyFactor: 0.125,
        designGoal_mSvWeek: 0.02,
        unshielded_mSvWeek: 68,
        requiredThickness_mm: 16,
        materialCode: 'lead',
        status: 'warning',
        notes: ['Door must be reviewed in final QA'],
        sortOrder: 2,
      },
    ],
  };

  const persistedPlan = assertTrpcOk(
    'controlledZone.persistDraft',
    await trpcCall(
      'controlledZone.persistDraft',
      {
        projectId: String(ids.projectId),
        draft,
        reportExport: {
          exportId,
          reportType: 'memoria-analitica',
          fileName: 'f133-api-memoria.txt',
          mimeType: 'text/plain',
          hashSha256: reportHash,
          metadata: { projectId: ids.projectId, reportId: ids.reportId, calculationId: ids.calculationId },
        },
      },
      cookieHeader,
    ),
  );
  addCheck('api-result:controlled-zone-created', persistedPlan?.mode === 'created', {
    mode: persistedPlan?.mode,
    planId: persistedPlan?.planId,
    calculationCount: persistedPlan?.calculationCount,
  });

  const plan = assertTrpcOk(
    'controlledZone.getPlan',
    await trpcCall('controlledZone.getPlan', { planKey }, cookieHeader, 'GET'),
  );
  addCheck('api-result:controlled-zone-readback', plan?.calculations?.length === 2 && plan?.reportExports?.length === 1, {
    calculationCount: plan?.calculations?.length,
    reportExportCount: plan?.reportExports?.length,
    memorySnapshotCount: plan?.memorySnapshots?.length,
  });

  const plans = assertTrpcOk(
    'controlledZone.listPlans',
    await trpcCall('controlledZone.listPlans', { projectId: String(ids.projectId), limit: 10 }, cookieHeader, 'GET'),
  );
  addCheck('api-result:controlled-zone-list', Array.isArray(plans) && plans.some((item) => item.planKey === planKey), {
    count: Array.isArray(plans) ? plans.length : 0,
  });

  const dbReadbackChecks = [
    ['db:project-owned-by-session-user', 'select count(*) as count from projects where id = ? and userId = ?', [ids.projectId, userId], 1],
    ['db:no-spoofed-project-owner', 'select count(*) as count from projects where id = ? and userId = ?', [ids.projectId, spoofedUserId], 0],
    ['db:calculation-owned-by-session-user', 'select count(*) as count from calculations where id = ? and userId = ?', [ids.calculationId, userId], 1],
    ['db:report-owned-by-session-user', 'select count(*) as count from reports where id = ? and userId = ?', [ids.reportId, userId], 1],
    ['db:controlled-zone-owned-by-session-user', 'select count(*) as count from controlled_zone_plans where plan_key = ? and user_id = ?', [planKey, userId], 1],
    ['db:controlled-zone-calculation-count', 'select count(*) as count from controlled_zone_calculations where plan_key = ?', [planKey], 2],
    ['db:analytic-memory-linked', 'select count(*) as count from analytic_memory_snapshots where plan_key = ? and user_id = ?', [planKey, userId], 1],
    ['db:report-export-linked', 'select count(*) as count from project_report_exports where export_id = ? and user_id = ? and hash_sha256 = ?', [exportId, userId, reportHash], 1],
  ];

  for (const [name, sql, params, expected] of dbReadbackChecks) {
    const count = await countOne(sql, params);
    const ok = expected === 0 ? count === 0 : count >= expected;
    addCheck(name, ok, { count, expected });
  }
} catch (error) {
  addCheck('fatal:f133-api-authenticated-smoke', false, {
    error: error instanceof Error ? error.message : String(error),
  });
} finally {
  await connection?.end();
}

const ok = checks.every((check) => check.ok);
const output = {
  phase: 'F133',
  generatedAt: new Date().toISOString(),
  status: ok ? 'ready' : 'blocked',
  userId,
  spoofedUserId,
  planKey,
  exportId,
  ids,
  checks,
  blockers: checks.filter((check) => !check.ok).map((check) => check.name),
  decision: ok
    ? 'F133 authenticated tRPC API persistence path is ready for browser release-candidate smoke.'
    : 'F133 authenticated tRPC API smoke failed; inspect blockers before browser RC smoke.',
};

fs.writeFileSync(`${outputDir}/f133_api_authenticated_smoke.json`, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(
  `${outputDir}/fase_133_api_authenticated_smoke.md`,
  [
    '# F133 API Authenticated Smoke',
    '',
    `Generated: ${output.generatedAt}`,
    `Status: ${output.status}`,
    `User: ${userId}`,
    `Project ID: ${ids.projectId ?? 'n/a'}`,
    `Plan key: ${planKey}`,
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
process.exit(ok ? 0 : 1);
