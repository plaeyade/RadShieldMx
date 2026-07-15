import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const tsxBin = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

if (!existsSync(tsxBin)) {
  console.error(`tsx runtime not found at ${tsxBin}`);
  process.exit(1);
}

const result = spawnSync(tsxBin, ["db/seed.ts"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
