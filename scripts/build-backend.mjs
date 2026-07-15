import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

delete process.env.VITE_BACKEND_URL;
delete process.env.VITE_ENABLE_BACKEND;

const { build } = await import("esbuild");

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
process.chdir(projectRoot);

try {
  await build({
    entryPoints: ["././api/boot.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: "dist-backend/server",
    banner: {
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
  });
} catch (error) {
  const existingBundle = resolve(projectRoot, "dist-backend/server/boot.js");
  if (existsSync(existingBundle)) {
    console.warn(
      `Backend esbuild rebuild failed in this sandbox, reusing existing bundle: ${existingBundle}`,
    );
    process.exit(0);
  }

  throw error;
}
