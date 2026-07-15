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
    url: connectionString ?? "mysql://radshield:radshield@127.0.0.1:3306/radshield_mx",
  },
});
