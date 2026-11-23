import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isGenerateCommand = process.argv.includes("generate");
const connectionString = process.env.DATABASE_URL;
if (!connectionString && !isGenerateCommand) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    // Sin DATABASE_URL sólo se permite `generate`, que no se conecta: URL sin credenciales.
    url: connectionString ?? "mysql://127.0.0.1:3306/radshield_mx",
  },
});
