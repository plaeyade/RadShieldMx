import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const app = (await import(pathToFileURL(resolve("dist-backend/server/boot.js")).href)).default;

async function requestJson(url, init) {
  const response = await app.fetch(new Request(url, init));
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text), text };
  } catch {
    return { status: response.status, body: null, text };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const publicChecks = [
  ["ping", "http://local/api/trpc/ping"],
];

for (const [name, url] of publicChecks) {
  const result = await requestJson(url);
  assert(result.status === 200, `${name} expected 200, got ${result.status}: ${result.text}`);
  assert(result.body?.result?.data?.json?.ok === true, `${name} returned unexpected body: ${result.text}`);
}

const protectedChecks = [
  ["auth.me", "http://local/api/trpc/auth.me"],
  ["project.list", 'http://local/api/trpc/project.list?input={"json":{}}'],
  ["simulation.list", 'http://local/api/trpc/simulation.list?input={"json":{}}'],
  ["dosimetry.listWorkspaces", 'http://local/api/trpc/dosimetry.listWorkspaces?input={"json":{}}'],
  ["controlledZone.listPlans", 'http://local/api/trpc/controlledZone.listPlans?input={"json":{}}'],
];

for (const [name, rawUrl] of protectedChecks) {
  const url = rawUrl.replace(/\{|\}|"/g, (char) => encodeURIComponent(char));
  const result = await requestJson(url);
  assert(result.status === 401, `${name} expected 401, got ${result.status}: ${result.text}`);
  assert(
    result.body?.error?.json?.data?.code === "UNAUTHORIZED",
    `${name} expected UNAUTHORIZED body, got: ${result.text}`,
  );
}

console.log("Backend contract checks OK");
