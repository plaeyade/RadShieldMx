import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import net from "node:net";
import process from "node:process";

process.env.DOCKER_CONFIG ??= `${process.cwd()}\\.docker-cli-config`;
mkdirSync(process.env.DOCKER_CONFIG, { recursive: true });

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(lookup, args, { stdio: "ignore", shell: false });
  return result.status === 0;
}

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
  });
}

function parseDatabaseUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: Number(url.port || 3306),
      database: url.pathname.replace(/^\//, ""),
      username: url.username,
    };
  } catch {
    return null;
  }
}

function checkTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
const dockerAvailable = commandExists("docker");
const mysqlAvailable = commandExists("mysql");
const mysqldAvailable = commandExists("mysqld");
const wslAvailable = commandExists("wsl");
let wslHasDistribution = false;

if (wslAvailable) {
  const wslList = run("wsl", ["-l", "-v"]);
  wslHasDistribution = wslList.status === 0 && !/no installed distributions/i.test(`${wslList.stdout}\n${wslList.stderr}`);
}

const beforeReachable = parsed ? await checkTcp(parsed.host, parsed.port) : false;
let attemptedStart = null;
let dockerInfo = null;

if (dockerAvailable) {
  const info = run("docker", ["info"]);
  dockerInfo = {
    ok: info.status === 0,
    status: info.status,
    stderr: info.stderr?.trim() || "",
  };
}

if (!beforeReachable && dockerAvailable) {
  attemptedStart = "docker compose -f docker-compose.db.yml up -d";
  const start = run("docker", ["compose", "-f", "docker-compose.db.yml", "up", "-d"]);
  attemptedStart = {
    command: "docker compose -f docker-compose.db.yml up -d",
    ok: start.status === 0,
    status: start.status,
    stderr: start.stderr?.trim() || "",
  };
}

const afterReachable = parsed ? await checkTcp(parsed.host, parsed.port, 3000) : false;
const report = {
  ok: afterReachable,
  phase: "F81",
  databaseUrlConfigured: Boolean(parsed),
  databaseTarget: parsed ? `${parsed.username}@${parsed.host}:${parsed.port}/${parsed.database}` : "missing or invalid",
  beforeReachable,
  afterReachable,
  tools: {
    docker: dockerAvailable,
    dockerEngineReachable: Boolean(dockerInfo?.ok),
    dockerEngineError: dockerInfo?.ok ? "" : dockerInfo?.stderr,
    mysql: mysqlAvailable,
    mysqld: mysqldAvailable,
    wsl: wslAvailable,
    wslHasDistribution,
  },
  attemptedStart,
  nextSteps: afterReachable
    ? [
        "Run node scripts/db-preflight.mjs.",
        "Run .\\node_modules\\.bin\\drizzle-kit.cmd migrate.",
        "Run node scripts/run-seed.mjs.",
        "Run $env:F76_SEED_LIVE='1'; node scripts/f76-seed-document-chunks.mjs.",
        "Run node scripts/db-live-validation.mjs.",
      ]
    : [
        dockerAvailable
          ? "Grant this Windows user/session access to Docker Desktop's docker_engine pipe, usually by adding the user to docker-users and restarting the session."
          : "Install/start Docker Desktop or install/start MySQL 8 compatible server.",
        "Keep DATABASE_URL=mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test or update .env to a reachable DB.",
        "If Docker Desktop is installed later, run docker compose -f docker-compose.db.yml up -d.",
        "Then rerun node scripts/f81-start-local-mysql.mjs.",
      ],
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
