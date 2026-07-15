import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const bundlePath = resolve("dist-backend/server/boot.js");
const app = (await import(pathToFileURL(bundlePath).href)).default;

const health = await app.fetch(new Request("http://local/health"));
if (health.status !== 200) {
  throw new Error(`/health returned ${health.status}`);
}

const healthBody = await health.json();
if (!healthBody.ok || healthBody.service !== "radshield-mx") {
  throw new Error(`/health returned unexpected body: ${JSON.stringify(healthBody)}`);
}

const dbHealth = await app.fetch(new Request("http://local/api/health/db"));
const dbHealthBody = await dbHealth.json();
const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);

if (databaseUrlConfigured && dbHealth.status !== 200) {
  throw new Error(`/api/health/db returned ${dbHealth.status}: ${JSON.stringify(dbHealthBody)}`);
}

if (!databaseUrlConfigured && dbHealth.status !== 503) {
  throw new Error(`/api/health/db should return 503 without DATABASE_URL, got ${dbHealth.status}`);
}

const ping = await app.fetch(new Request("http://local/api/trpc/ping"));
if (ping.status !== 200) {
  throw new Error(`/api/trpc/ping returned ${ping.status}: ${await ping.text()}`);
}

const pingBody = await ping.json();
if (!pingBody?.result?.data?.json?.ok) {
  throw new Error(`/api/trpc/ping returned unexpected body: ${JSON.stringify(pingBody)}`);
}

console.log("Backend health checks OK");
process.exit(0);
