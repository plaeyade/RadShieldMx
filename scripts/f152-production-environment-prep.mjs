import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f152_production_environment_prep');
const jsonPath = path.join(outDir, 'f152_production_environment_prep.json');
const mdPath = path.join(root, 'outputs', 'fase_152_production_environment_prep.md');
const envPath = path.join(root, '.env');

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function envValue(key, fileEnv) {
  return process.env[key] || fileEnv[key] || '';
}

function commandPath(command) {
  const probe = process.platform === 'win32' ? 'where' : 'command';
  const args = process.platform === 'win32' ? [command] : ['-v', command];
  const result = spawnSync(probe, args, { encoding: 'utf8', shell: process.platform !== 'win32' });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] ?? null;
}

function firstExisting(paths) {
  return paths.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function safeUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || null,
      pathname: url.pathname || '/',
      origin: url.origin,
    };
  } catch {
    return { parseError: true };
  }
}

function safeDb(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, '') || null,
      userPresent: Boolean(url.username),
      passwordPresent: Boolean(url.password),
    };
  } catch {
    return { parseError: true };
  }
}

const fileEnv = parseEnvFile(envPath);
const publicUrl = envValue('PUBLIC_DEPLOY_URL', fileEnv) || envValue('PLAYWRIGHT_TEST_BASE_URL', fileEnv);
const backendUrl = envValue('VITE_BACKEND_URL', fileEnv);
const enableBackend = envValue('VITE_ENABLE_BACKEND', fileEnv);
const databaseUrl = envValue('DATABASE_URL', fileEnv);
const appSecret = envValue('APP_SECRET', fileEnv) || envValue('JWT_SECRET', fileEnv);
const mysqlBinDir = envValue('MYSQL_BIN_DIR', fileEnv);

const commonMysqlDirs = [
  mysqlBinDir,
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.3\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.2\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.1\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin',
  'C:\\Program Files\\MariaDB 11.4\\bin',
  'C:\\Program Files\\MariaDB 11.3\\bin',
].filter(Boolean);

const mysqlPath = commandPath('mysql') || firstExisting(commonMysqlDirs.map((dir) => path.join(dir, 'mysql.exe')));
const mysqldumpPath = commandPath('mysqldump') || firstExisting(commonMysqlDirs.map((dir) => path.join(dir, 'mysqldump.exe')));
const distIndex = fs.existsSync(path.join(root, 'dist', 'index.html'));
const backendBoot = fs.existsSync(path.join(root, 'dist-backend', 'server', 'boot.js'));
const f150 = fs.existsSync(path.join(root, 'outputs', 'f150_release_candidate_controlled', 'f150_release_candidate_controlled.json'));
const f151 = fs.existsSync(path.join(root, 'outputs', 'f151_prepublish_hardening', 'f151_prepublish_hardening.json'));

const runtimeOptions = [
  {
    id: 'static-offline',
    label: 'Frontend estatico/offline',
    readiness: distIndex ? 'pass' : 'gated',
    useWhen: 'Demo, revision local, uso sin persistencia multiusuario.',
    requirement: 'dist/index.html disponible.',
  },
  {
    id: 'split-frontend-api',
    label: 'Frontend estatico + API Node + MySQL',
    readiness: distIndex && backendBoot && databaseUrl ? 'ready-to-run' : 'gated',
    useWhen: 'Release controlado recomendado.',
    requirement: 'dist, dist-backend, DATABASE_URL y host API.',
  },
  {
    id: 'fullstack-managed-db',
    label: 'Hosting con MySQL administrado',
    readiness: databaseUrl && appSecret ? 'ready-to-run' : 'gated',
    useWhen: 'Produccion estable.',
    requirement: 'Variables productivas en proveedor, backup/restore y smoke publico.',
  },
];

const gates = [
  {
    id: 'release-basis',
    label: 'Base F150/F151',
    status: f150 && f151 ? 'pass' : 'gated',
    evidence: { f150, f151 },
  },
  {
    id: 'deploy-target',
    label: 'Target deploy/URL',
    status: publicUrl ? 'pass' : 'gated',
    evidence: safeUrl(publicUrl),
  },
  {
    id: 'frontend-artifact',
    label: 'Artefacto frontend',
    status: distIndex ? 'pass' : 'gated',
    evidence: 'dist/index.html',
  },
  {
    id: 'backend-artifact',
    label: 'Artefacto backend',
    status: backendBoot ? 'pass' : 'ready-to-run',
    evidence: 'dist-backend/server/boot.js',
  },
  {
    id: 'backend-bridge',
    label: 'Bridge frontend API',
    status: enableBackend === 'true' && backendUrl ? 'pass' : 'ready-to-run',
    evidence: {
      viteEnableBackend: enableBackend || null,
      backendUrl: safeUrl(backendUrl),
    },
  },
  {
    id: 'production-secrets',
    label: 'Secretos productivos',
    status: databaseUrl && appSecret && appSecret.length >= 16 ? 'pass' : 'gated',
    evidence: {
      databaseUrl: safeDb(databaseUrl),
      appSecretPresent: Boolean(appSecret),
      appSecretLengthOk: appSecret.length >= 16,
    },
  },
  {
    id: 'mysql-tools',
    label: 'Herramientas MySQL',
    status: mysqlPath && mysqldumpPath ? 'pass' : 'gated',
    evidence: {
      mysqlPath,
      mysqldumpPath,
      mysqlBinDir: mysqlBinDir || null,
      searchedCommonDirs: commonMysqlDirs,
    },
  },
];

const manifest = {
  phase: 'F152',
  title: 'Preparacion de ambiente real',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.production-environment-prep.f152.v1',
  status: 'production-environment-prep',
  goNoGo: gates.every((gate) => gate.status === 'pass') ? 'ready-for-f153-db-backup' : 'blocked-until-runtime-values',
  runtimeOptions,
  gates,
  recommendedDecision: 'Usar frontend estatico + API Node + MySQL Windows/administrado. Docker queda como alternativa secundaria si el entorno vuelve a fallar.',
  requiredEnv: [
    'PUBLIC_DEPLOY_URL or PLAYWRIGHT_TEST_BASE_URL',
    'DATABASE_URL',
    'APP_SECRET or JWT_SECRET',
    'VITE_ENABLE_BACKEND=true for connected deploy',
    'VITE_BACKEND_URL',
    'MYSQL_BIN_DIR if mysql/mysqldump are not in PATH',
  ],
  commandSequence: [
    'npm run build',
    'npm run build:backend',
    'npm run prepare:f152:environment',
    'npm run prepare:f151:prepublish',
    'RADSHIELD_ALLOW_DB_BACKUP=1 npm run prepublish:backup-db',
    'RADSHIELD_ALLOW_PUBLIC_SMOKE=1 PUBLIC_DEPLOY_URL=https://<url-final> npm run prepublish:smoke-url',
  ],
  nextPhase: 'F153 backup/restore DB real cuando mysql/mysqldump esten disponibles y URL/target queden definidos.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F152 - Preparacion De Ambiente Real',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Go/No-Go: **${manifest.goNoGo}**`,
  '',
  '## Runtime recomendado',
  '',
  manifest.recommendedDecision,
  '',
  '## Opciones De Runtime',
  '',
  ...runtimeOptions.map((option) => `- ${option.label}: ${option.readiness.toUpperCase()} - ${option.requirement}`),
  '',
  '## Gates',
  '',
  ...gates.map((gate) => `- ${gate.label}: ${gate.status.toUpperCase()}`),
  '',
  '## Variables Requeridas',
  '',
  ...manifest.requiredEnv.map((item) => `- ${item}`),
  '',
  '## Secuencia',
  '',
  ...manifest.commandSequence.map((item) => `- ${item}`),
  '',
  `Siguiente: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F152 production environment prep written: ${path.relative(root, jsonPath)}`);
console.log(`Go/No-Go: ${manifest.goNoGo}`);
