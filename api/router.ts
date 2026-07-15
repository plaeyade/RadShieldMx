import { authRouter } from "./auth-router";
import { projectRouter } from "./project-router";
import { auditRouter } from "./audit-router";
import { simulationRouter } from "./simulation-router";
import { materialRouter } from "./material-router";
import { calculationRouter } from "./calculation-router";
import { reportRouter } from "./report-router";
import { aiRouter } from "./ai-router";
import { ragRouter } from "./rag-router";
import { mlRouter } from "./ml-router";
import { agentRouter } from "./agent-router";
import { dosimetryRouter } from "./dosimetry-router";
import { controlledZoneRouter } from "./controlled-zone-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  project: projectRouter,
  audit: auditRouter,
  simulation: simulationRouter,
  material: materialRouter,
  calculation: calculationRouter,
  report: reportRouter,
  ai: aiRouter,
  rag: ragRouter,
  ml: mlRouter,
  agent: agentRouter,
  dosimetry: dosimetryRouter,
  controlledZone: controlledZoneRouter,
});

export type AppRouter = typeof appRouter;
