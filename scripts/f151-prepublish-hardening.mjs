import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f151_prepublish_hardening');
const jsonPath = path.join(outDir, 'f151_prepublish_hardening.json');
const mdPath = path.join(root, 'outputs', 'fase_151_prepublish_hardening.md');
const freezePath = path.join(outDir, 'RELEASE_FREEZE.md');
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

function commandExists(command) {
  const probe = process.platform === 'win32' ? 'where' : 'command';
  const args = process.platform === 'win32' ? [command] : ['-v', command];
  return spawnSync(probe, args, { stdio: 'ignore', shell: process.platform !== 'win32' }).status === 0;
}

function safeDbDescriptor(raw) {
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
    return { parseError: true, userPresent: false, passwordPresent: false };
  }
}

const fileEnv = parseEnvFile(envPath);
const publicUrl = envValue('PUBLIC_DEPLOY_URL', fileEnv) || envValue('PLAYWRIGHT_TEST_BASE_URL', fileEnv);
const databaseUrl = envValue('DATABASE_URL', fileEnv);
const appSecret = envValue('APP_SECRET', fileEnv) || envValue('JWT_SECRET', fileEnv);
const viteBackendUrl = envValue('VITE_BACKEND_URL', fileEnv);
const mysqldumpPresent = commandExists('mysqldump');
const mysqlPresent = commandExists('mysql');
const backupDir = path.join(outDir, 'db_backup');
const backupFiles = fs.existsSync(backupDir)
  ? fs.readdirSync(backupDir).filter((name) => /\.(sql|dump|gz)$/i.test(name))
  : [];

const gates = [
  {
    id: 'deploy-target',
    label: 'Target de deploy',
    status: publicUrl ? 'pass' : 'gated',
    evidence: publicUrl ? 'URL final configurada en entorno.' : 'PUBLIC_DEPLOY_URL o PLAYWRIGHT_TEST_BASE_URL no configurado.',
    detail: publicUrl ? new URL(publicUrl).origin : null,
  },
  {
    id: 'production-secrets',
    label: 'Secretos productivos',
    status: databaseUrl && appSecret && appSecret.length >= 16 ? 'pass' : 'gated',
    evidence: 'Validacion por presencia y forma; no se imprimen secretos.',
    detail: {
      databaseUrl: safeDbDescriptor(databaseUrl),
      appSecretPresent: Boolean(appSecret),
      appSecretLengthOk: appSecret.length >= 16,
      viteBackendUrlConfigured: Boolean(viteBackendUrl),
    },
  },
  {
    id: 'db-backup-restore',
    label: 'Backup/restore DB',
    status: mysqldumpPresent && mysqlPresent && backupFiles.length > 0 ? 'pass' : 'ready-to-run',
    evidence: backupFiles.length > 0
      ? `Backup artifact present: ${backupFiles.join(', ')}`
      : 'Pendiente ejecutar backup real y restore test con MySQL tools disponibles.',
    detail: {
      mysqlPresent,
      mysqldumpPresent,
      backupDir: 'outputs/f151_prepublish_hardening/db_backup',
      backupFiles,
    },
  },
  {
    id: 'public-url-smoke',
    label: 'Smoke URL final',
    status: publicUrl ? 'ready-to-run' : 'gated',
    evidence: publicUrl
      ? 'URL lista para ejecutar npm run prepublish:smoke-url.'
      : 'No hay URL final para smoke publico.',
    detail: {
      command: 'npm run prepublish:smoke-url',
    },
  },
  {
    id: 'release-freeze',
    label: 'Freeze de cambios grandes',
    status: 'pass',
    evidence: 'RELEASE_FREEZE.md generado.',
    detail: {
      allowed: ['fixes bloqueantes', 'configuracion/secrets', 'documentacion operacional', 'smoke evidence'],
      blocked: ['features grandes', 'refactors amplios', 'cambios de calculo sin QA numerico'],
    },
  },
];

const manifest = {
  phase: 'F151',
  title: 'Cinco cambios prepublicacion',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.prepublish-hardening.f151.v1',
  status: 'prepublish-hardening-ready',
  goNoGo: gates.every((gate) => gate.status === 'pass') ? 'public-go' : 'public-no-go-until-runtime-gates-pass',
  gates,
  secretsPolicy: [
    'No escribir DATABASE_URL, APP_SECRET/JWT ni claves KIMI/OpenAI en outputs.',
    'Solo guardar presencia, forma y descriptor no sensible.',
    'Usar variables del host para produccion.',
  ],
  backupPolicy: [
    'Ejecutar backup DB antes de publicar.',
    'Probar restore en base temporal o ambiente staging.',
    'Conservar hash SHA-256 del dump o artefacto comprimido.',
  ],
  smokePolicy: [
    'Ejecutar Playwright contra URL final.',
    'Guardar JSON/captura/log en outputs.',
    'No liberar si falla login, canvas, calculo, memoria, reportes o Evidence Pack.',
  ],
  freezeHash: crypto.createHash('sha256').update(gates.map((gate) => `${gate.id}:${gate.status}`).join('|')).digest('hex'),
  nextCommandSequence: [
    'npm run prepare:f151:prepublish',
    'npm run prepublish:backup-db',
    'PUBLIC_DEPLOY_URL=https://<url-final> npm run prepublish:smoke-url',
    'npm run test:f151:prepublish',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(freezePath, [
  '# Release Freeze F151',
  '',
  'Desde F151 hasta publicacion:',
  '',
  '- Permitido: fixes bloqueantes, configuracion/secrets, backup/restore, smoke evidence y documentacion operacional.',
  '- Bloqueado: features grandes, refactors amplios, cambios de calculo sin QA numerico y cambios de UI que invaliden smoke.',
  '- Si un gate falla, se corrige de forma focalizada y se repite el smoke afectado.',
  '',
  `Freeze hash: ${manifest.freezeHash}`,
  '',
].join('\n'), 'utf8');
fs.writeFileSync(mdPath, [
  '# F151 - Cinco Cambios Antes De Publicar',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Go/No-Go: **${manifest.goNoGo}**`,
  '',
  '## Gates',
  '',
  ...gates.map((gate) => `- ${gate.label}: ${gate.status.toUpperCase()} - ${gate.evidence}`),
  '',
  '## Politica De Secretos',
  '',
  ...manifest.secretsPolicy.map((item) => `- ${item}`),
  '',
  '## Backup/Restore',
  '',
  ...manifest.backupPolicy.map((item) => `- ${item}`),
  '',
  '## Smoke Publico',
  '',
  ...manifest.smokePolicy.map((item) => `- ${item}`),
  '',
  '## Secuencia',
  '',
  ...manifest.nextCommandSequence.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F151 prepublish hardening written: ${path.relative(root, jsonPath)}`);
console.log(`Go/No-Go: ${manifest.goNoGo}`);
