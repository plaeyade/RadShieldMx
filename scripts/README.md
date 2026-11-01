# Scripts de RadShieldMx

Índice generado en la depuración etapa 2 (2026-11-01).

El ciclo de desarrollo usa sólo:

- `npm run check`: cuarentena, `tsc` de app y servidor, y build.
- `npm test`: Vitest.
- `npm run lint`: ESLint.
- `npm run build:backend`: compila el backend.

Lo demás se ejecuta a mano y por necesidad.

## Build y despliegue (15)

Compilan el backend, preparan y verifican despliegues.

| Script | npm |
| --- | --- |
| `build-backend.mjs` | `build:backend` |
| `check-deploy-config.mjs` | `test:deploy:config` |
| `check-f154-public-url-smoke-contracts.mjs` | `test:f154:public-smoke` |
| `check-f158-deploy-target-post-smoke-contracts.mjs` | `test:f158:deploy-target` |
| `check-f169-predeploy-numeric-db-qa-contracts.mjs` | `test:f169:numeric-db-qa` |
| `f136-production-deploy-rehearsal.mjs` | `prepare:f136:deploy-rehearsal` |
| `f151-public-url-smoke.mjs` | `prepublish:smoke-url` |
| `f152-production-environment-prep.mjs` | `prepare:f152:environment` |
| `f154-public-url-smoke.mjs` | `prepare:f154:public-smoke` |
| `f158-deploy-target-post-smoke.mjs` | `prepare:f158:deploy-target` |
| `f159-sites-hosting-prep.mjs` | `prepare:f159:sites-hosting` |
| `f167-deploy-target-recovery.mjs` | `prepare:f167:deploy-target` |
| `f169-predeploy-numeric-db-qa.mjs` | `prepare:f169:numeric-db-qa` |
| `f177-sites-deploy-retry.mjs` | `prepare:f177:sites-deploy` |
| `f181-deploy-now-handoff.mjs` | `prepare:f181:deploy-now` |

## Base de datos (13)

MySQL/Drizzle: preflight, semilla, respaldo y restauración, validación en vivo. Requieren `DATABASE_URL`.

| Script | npm |
| --- | --- |
| `db-live-validation.mjs` | `db:validate:live` |
| `db-preflight.mjs` | `db:preflight` |
| `db-reconstruction-plan.mjs` | `db:reconstruct:plan` |
| `f128-mysql-windows-validation.mjs` | `prepare:f128:mysql-windows` |
| `f130-db-live-release.mjs` | `prepare:f130:db-live` |
| `f151-db-backup-restore.mjs` | `prepublish:backup-db` |
| `f153-db-backup-restore.mjs` | `prepare:f153:db-backup-restore` |
| `f168-db-live-finalization.mjs` | `prepare:f168:db-live-final` |
| `f505-regulatory-materials-schema-apply.mjs` | `prepare:f505:regulatory-materials-schema` |
| `f506-f507-regulatory-seed-readback.mjs` | `prepare:f506-f507:regulatory-seed-readback` |
| `f81-host-docker-reconstruct.ps1` | — |
| `f81-start-local-mysql.mjs` | `db:start:f81` |
| `run-seed.mjs` | `db:seed` |

## RAG, OCR e ingesta documental (28)

Ingesta de PDF, OCR local y gobierno de citas. Cuando GAMMA-AI esté conectado, la evidencia llega por `gamma/evidencia@1` (ADR-0034 de GAMMA-AI).

| Script | npm |
| --- | --- |
| `check-f231-f236-canvas-release-coverage-contracts.mjs` | `test:f231-f236:canvas-release-coverage` |
| `f138-material-rag-robot.mjs` | `prepare:f138:material-rag` |
| `f139-material-citation-ocr-audit.mjs` | `prepare:f139:material-audit` |
| `f141-material-ocr-recovery.mjs` | `prepare:f141:material-ocr` |
| `f143-zumaya-document-ingestion.mjs` | `prepare:f143:zumaya-docs` |
| `f170-rag-citation-governance.mjs` | `prepare:f170:rag-citations` |
| `f170b-reindex-canonical-pdfs.mjs` | `prepare:f170b:canonical-reindex` |
| `f170b_extract_pdf_text.py` | — |
| `f172a-index-arxiv-research.mjs` | `prepare:f172a:arxiv-research` |
| `f268-real-memory-ingestion.mjs` | `prepare:f268:real-memory-ingestion` |
| `f268a-api-readiness.mjs` | `prepare:f268a:api-readiness` |
| `f269-ocr-cloud-adapter-gate.mjs` | `prepare:f269:ocr-cloud` |
| `f271-literature-deep-dive-gate.mjs` | `prepare:f271:literature-deep-dive` |
| `f279-local-free-ocr-gate.mjs` | `prepare:f279:local-free-ocr` |
| `f280-local-ocr-smoke.mjs` | `prepare:f280:local-ocr-smoke` |
| `f281-full-local-ocr.mjs` | `prepare:f281:full-local-ocr` |
| `f285-controlled-rag-seed.mjs` | `prepare:f285:controlled-rag-seed` |
| `f287-approved-only-rag-seed.mjs` | `prepare:f287:approved-only-rag-seed` |
| `f288-rag-approved-validation.mjs` | `prepare:f288:rag-approved-validation` |
| `f313-nist-xcom-mixture-rag.mjs` | `prepare:f313:nist-xcom-mixture-rag` |
| `f75-prepare-pdf-rag.mjs` | `prepare:f75:pdf-rag` |
| `f75_extract_pdf_text.py` | — |
| `f76-ocr-pending-pdfs.mjs` | `prepare:f76:ocr` |
| `f76-seed-document-chunks.mjs` | `db:seed:f76:documents` |
| `f77-ocr-install-check.mjs` | `prepare:f77:ocr-db` |
| `ingest-from-web-data.ts` | — |
| `ingest-knowledge.ts` | — |
| `ingest-pdf-v3.ts` | — |

## Smoke y QA de interfaz (44)

Recorridos de interfaz y E2E. La mayoría necesita la app levantada (`npm run dev` o `npm run preview`).

| Script | npm |
| --- | --- |
| `check-all-submenus-smoke.mjs` | `test:submenus:smoke` |
| `check-controlled-zone-functional-smoke.mjs` | `test:controlled-zone:functional` |
| `check-dwg-local-conversion-probe-contracts.mjs` | `test:dwg-local-conversion` |
| `check-f115-visual-menu-smoke.mjs` | `test:f115:visual-menu-smoke` |
| `check-f120-runtime-profile-smoke.mjs` | `test:f120:runtime-profile-smoke` |
| `check-f149-normative-numeric-qa-contracts.mjs` | `test:f149:numeric-qa` |
| `check-f197-menu-canvas-smoke.mjs` | `test:f197:menu-canvas-smoke` |
| `check-f198-full-menu-function-smoke.mjs` | `test:f198:menus-smoke` |
| `check-f199-output-smoke.mjs` | `test:f199:outputs-smoke` |
| `check-f201-workflow-panel-smoke.mjs` | `test:f201:workflow-panel-smoke` |
| `check-f202-public-vercel-smoke.mjs` | `test:f202:public-vercel-smoke` |
| `check-f204-canvas-dxf-recovery-smoke.mjs` | `test:f204:canvas-dxf-smoke` |
| `check-f207-functional-app-qa-contracts.mjs` | `test:f207:functional-app-qa` |
| `check-f207-functional-app-qa-smoke.mjs` | `test:f207:functional-app-qa-smoke` |
| `check-f213-dxf-layer-mapping-qa-contracts.mjs` | `test:f213:dxf-layer-mapping` |
| `check-f229-canvas-cad-e2e-harness-contracts.mjs` | `test:f229:canvas-e2e-contracts` |
| `check-f267-real-case-smoke-execution-contracts.mjs` | `test:f267:real-case-smoke` |
| `check-f292-real-project-floorplan-qa-contracts.mjs` | `test:f292:real-project-floorplan-qa` |
| `check-f362-ui-regression-smoke.mjs` | `test:f362:ui-regression-smoke` |
| `check-f383-p0-dialogshell-integration-qa.mjs` | `test:f383:p0-integration-qa` |
| `check-f455-babylon-runtime-smoke-contracts.mjs` | `test:f455:babylon-runtime` |
| `check-f651-f655-renderer-activation-qa-values.mjs` | `test:f651-f655:renderer-activation-qa:values` |
| `check-f671-f680-renderer-alignment-owner-smoke-values.mjs` | `test:f671-f680:renderer-alignment-owner-smoke:values` |
| `check-f686-f690-renderer-before-after-smoke-values.mjs` | `test:f686-f690:renderer-before-after-smoke:values` |
| `check-f69-canvas-buttons-smoke.mjs` | `test:f69:canvas` |
| `check-f691-f700-owner-smoke-photoreal-values.mjs` | `test:f691-f700:owner-smoke-photoreal:values` |
| `check-f75-smart-room-evidence-smoke.mjs` | `test:f75:smoke` |
| `check-f78-document-evidence-smoke.mjs` | `test:f78:document-smoke` |
| `check-menu-submenus-smoke.mjs` | `test:menus:smoke` |
| `dwg-local-conversion-probe.mjs` | `prepare:dwg-local-conversion` |
| `f131-fullstack-live-smoke.mjs` | `prepare:f131:fullstack-live` |
| `f132-rc-persistence-smoke.mjs` | `prepare:f132:rc-persistence` |
| `f133-api-authenticated-smoke.mjs` | `prepare:f133:api-auth` |
| `f149-normative-numeric-qa.mjs` | `prepare:f149:numeric-qa` |
| `f169-numeric-runtime-smoke.ts` | — |
| `f176-local-smoke-final.mjs` | `prepare:f176:local-smoke` |
| `f267-real-case-smoke-execution.mjs` | `prepare:f267:real-case-smoke` |
| `f270-aps-dwg-fixture-smoke.mjs` | `prepare:f270:aps-dwg-smoke` |
| `f292-real-project-floorplan-qa.mjs` | `prepare:f292:real-project-floorplan-qa` |
| `f294-real-guided-smoke.mjs` | `prepare:f294:real-guided-smoke` |
| `f295-canvas-redesign-smoke.mjs` | `prepare:f295:canvas-redesign-smoke` |
| `f508-f509-post-seed-qa.mjs` | `prepare:f508-f509:post-seed-qa` |
| `run-dxf-import-e2e.mjs` | `test:dxf-import` |
| `run-real-dxf-e2e.mjs` | `test:real-dxf-import` |

## Otros (11)

Utilidades sueltas.

| Script | npm |
| --- | --- |
| `archivo-menu-closure.mjs` | `prepare:archivo-menu-closure` |
| `check-archivo-menu-closure-contracts.mjs` | `test:archivo-menu-closure` |
| `check-backend-contracts.mjs` | `test:backend:contracts` |
| `check-backend-health.mjs` | `test:backend:health` |
| `check-cad-like-completion-contracts.mjs` | `test:cad-like:completion` |
| `check-dialog-route-dedup-contracts.mjs` | `test:dialog-route-dedup` |
| `csv_to_root.py` | — |
| `extract-f414-bim-video-frames.ps1` | — |
| `run-release-validation.mjs` | `validate:release` |
| `runner.py` | — |
| `verify-quarantine.mjs` | `check`, `check:stable`, `check:quarantine` |

## Gate o reporte de fase (historico) (95)

Cada uno generó la evidencia de cierre de una fase (F1xx–F6xx). Se conservan para reproducir esa evidencia, pero no forman parte del ciclo de desarrollo ni del CI.

| Script | npm |
| --- | --- |
| `check-f131-fullstack-live-contracts.mjs` | `test:f131:fullstack-live` |
| `check-f144-source-governance-contracts.mjs` | `test:f144:source-governance` |
| `check-f151-prepublish-hardening-contracts.mjs` | `test:f151:prepublish` |
| `check-f153-db-backup-restore-contracts.mjs` | `test:f153:db-backup-restore` |
| `check-f155-controlled-release-decision-contracts.mjs` | `test:f155:release-decision` |
| `check-f156-final-package-contracts.mjs` | `test:f156:final-package` |
| `check-f168-db-live-finalization-contracts.mjs` | `test:f168:db-live-final` |
| `check-f197-menu-canvas-contracts.mjs` | `test:f197:menu-canvas` |
| `check-f200-static-frontend-release-gate-contracts.mjs` | `test:f200:static-release-gate` |
| `check-f204-canvas-dxf-recovery-contracts.mjs` | `test:f204:canvas-dxf-recovery` |
| `check-f238-f247-release-execution-contracts.mjs` | `test:f238-f247:release-execution` |
| `check-f248-f250-release-candidate-contracts.mjs` | `test:f248-f250:release-candidate` |
| `check-f251-f255-high-risk-cad-gate-contracts.mjs` | `test:f251-f255:high-risk-cad` |
| `check-f256-f260-next-phase-roadmap-contracts.mjs` | `test:f256-f260:roadmap` |
| `check-f257-f260-full-execution-contracts.mjs` | `test:f257-f260:full` |
| `check-f261-f262-dwg-provider-fixture-contracts.mjs` | `test:f261-f262:dwg` |
| `check-f263-aps-dwg-adapter-contracts.mjs` | `test:f263:aps-dwg` |
| `check-f264-real-clinical-trial-contracts.mjs` | `test:f264:real-trial` |
| `check-f265-real-app-testing-protocol-contracts.mjs` | `test:f265:real-app-testing` |
| `check-f266-real-case-evidence-kit-contracts.mjs` | `test:f266:real-case-kit` |
| `check-f311-babylon-safe-adapter-contracts.mjs` | `test:f311:babylon-safe-adapter` |
| `check-f331-f338-static-release-close-contracts.mjs` | `test:f331-f338:static-release-close` |
| `check-f339-real-case-centro-neuro-contracts.mjs` | `test:f339:real-case-centro-neuro` |
| `check-f340-centro-neuro-operator-trial-contracts.mjs` | `test:f340:centro-neuro-operator-trial` |
| `check-f341-centro-neuro-calibrated-trial-contracts.mjs` | `test:f341:centro-neuro-calibrated-trial` |
| `check-f342-centro-neuro-visual-evidence-contracts.mjs` | `test:f342:centro-neuro-visual-evidence` |
| `check-f379-barrier-editor-dialogshell-contracts.mjs` | `test:f379:barrier-editor` |
| `check-f380-air-kerma-dialogshell-contracts.mjs` | `test:f380:air-kerma-overlay` |
| `check-f381-control-points-dialogshell-contracts.mjs` | `test:f381:control-points` |
| `check-f382-p0-dialogshell-closure-contracts.mjs` | `test:f382:p0-dialogshell-closure` |
| `check-f389-f391-dialogshell-contracts.mjs` | `test:f389-f391:dialogshell-migration` |
| `check-f392-f398-fullscreen-shell-contracts.mjs` | `test:f392-f398:fullscreen-shell` |
| `check-f399-f403-window-beta-contracts.mjs` | `test:f399-f403:window-beta` |
| `check-f464-f468-visual-beta-contracts.mjs` | `test:f464-f468:visual-beta` |
| `check-f469-visual-beta-publication-contracts.mjs` | `test:f469:visual-beta-publication` |
| `check-f591-f620-general-improvements-values.mjs` | `test:f591-f620:general-improvements:values` |
| `check-f621-f625-renderer-base-deep-values.mjs` | `test:f621-f625:renderer-base-deep:values` |
| `check-f626-f630-renderer-scheduler-values.mjs` | `test:f626-f630:renderer-scheduler:values` |
| `check-f631-f635-renderer-tile-invalidation-values.mjs` | `test:f631-f635:renderer-tile-invalidation:values` |
| `check-f636-f640-renderer-hit-test-shadow-values.mjs` | `test:f636-f640:renderer-hit-test-shadow:values` |
| `check-f641-f645-renderer-event-dry-run-values.mjs` | `test:f641-f645:renderer-event-dry-run:values` |
| `check-f646-f650-renderer-selection-transaction-values.mjs` | `test:f646-f650:renderer-selection-transaction:values` |
| `check-f656-f660-renderer-legacy-click-probe-values.mjs` | `test:f656-f660:renderer-legacy-click-probe:values` |
| `check-f661-f665-renderer-observed-click-bridge-values.mjs` | `test:f661-f665:renderer-observed-click-bridge:values` |
| `check-f666-f670-renderer-selection-stabilizer-values.mjs` | `test:f666-f670:renderer-selection-stabilizer:values` |
| `check-f681-f685-renderer-targeted-legacy-click-values.mjs` | `test:f681-f685:renderer-targeted-legacy-click:values` |
| `check-f76-analytic-memory-evidence-contracts.mjs` | `test:f76:memory-evidence` |
| `check-f77-document-export-evidence-contracts.mjs` | `test:f77:document-evidence` |
| `check-f81-db-url-contracts.mjs` | `test:f81:db-url` |
| `f144-source-governance.mjs` | `prepare:f144:source-governance` |
| `f151-prepublish-hardening.mjs` | `prepare:f151:prepublish` |
| `f155-controlled-release-decision.mjs` | `prepare:f155:release-decision` |
| `f156-final-package.mjs` | `prepare:f156:final-package` |
| `f172-release-candidate-final.mjs` | `prepare:f172:release-final` |
| `f200-static-frontend-release-gate.mjs` | `prepare:f200:static-release-gate` |
| `f238-f247-release-execution.mjs` | `prepare:f238-f247:release-execution` |
| `f248-f250-release-candidate.mjs` | `prepare:f248-f250:release-candidate` |
| `f251-f255-high-risk-cad-gate.mjs` | `prepare:f251-f255:high-risk-cad` |
| `f256-f260-next-phase-roadmap.mjs` | `prepare:f256-f260:roadmap` |
| `f257-f260-full-execution.mjs` | `prepare:f257-f260:full` |
| `f260-fullstack-db-gate.mjs` | `prepare:f260:db-gate` |
| `f261-f262-dwg-provider-fixture.mjs` | `prepare:f261-f262:dwg` |
| `f263-aps-dwg-adapter.mjs` | `prepare:f263:aps-dwg` |
| `f264-real-clinical-trial-gate.mjs` | `prepare:f264:real-trial` |
| `f265-real-app-testing-protocol.mjs` | `prepare:f265:real-app-testing` |
| `f266-real-case-evidence-kit.mjs` | `prepare:f266:real-case-kit` |
| `f272-external-mc-runner-gate.mjs` | `prepare:f272:external-mc-runner` |
| `f273-f278-live-integration-readiness.mjs` | `prepare:f273-f278:live-integrations` |
| `f293-static-release-refresh-real-trial.mjs` | `prepare:f293:static-release-refresh` |
| `f296-f300-canvas-3d-workbench.mjs` | `prepare:f296-f300:canvas-3d-workbench` |
| `f301-f306-functional-release-close.mjs` | `prepare:f301-f306:functional-release-close` |
| `f307-f309-3d-engine-release.mjs` | `prepare:f307-f309:3d-engine-release` |
| `f310-real-operator-three-r3f.mjs` | `prepare:f310:real-operator-three-r3f` |
| `f311-babylon-safe-adapter.mjs` | `prepare:f311:babylon-safe-adapter` |
| `f312-unity-external-handoff.mjs` | `prepare:f312:unity-external-handoff` |
| `f314-babylon-runtime-loader.mjs` | `prepare:f314:babylon-runtime-loader` |
| `f331-f338-static-release-close.mjs` | `prepare:f331-f338:static-release-close` |
| `f339-real-case-centro-neuro.mjs` | `prepare:f339:real-case-centro-neuro` |
| `f340-centro-neuro-operator-trial.mjs` | `prepare:f340:centro-neuro-operator-trial` |
| `f341-centro-neuro-calibrated-trial.mjs` | `prepare:f341:centro-neuro-calibrated-trial` |
| `f342-centro-neuro-visual-evidence.mjs` | `prepare:f342:centro-neuro-visual-evidence` |
| `f350-f355-real-test-package.mjs` | `prepare:f350-f355:real-test-package` |
| `f356-f360-beta-release.mjs` | `prepare:f356-f360:beta-release` |
| `f361-post-beta-repair.mjs` | `prepare:f361:post-beta-repair` |
| `f372-beta-static-package.mjs` | `prepare:f372:beta-package` |
| `f389-f391-dialogshell-migration-audit.mjs` | `prepare:f389-f391:dialogshell-migration` |
| `f392-f398-fullscreen-shell-audit.mjs` | `prepare:f392-f398:fullscreen-shell` |
| `f399-f403-window-beta-audit.mjs` | `prepare:f399-f403:window-beta` |
| `f464-f468-visual-beta-audit.mjs` | `prepare:f464-f468:visual-beta` |
| `f469-visual-beta-publication-close.mjs` | `prepare:f469:visual-beta-publication` |
| `f500-regulatory-materials-live-gate.mjs` | `prepare:f500:regulatory-materials-live-gate` |
| `f510-diagnostic-pet-tvl-promotion.mjs` | `prepare:f510:diagnostic-pet-tvl` |
| `f511-f514-beta-closure.mjs` | `prepare:f511-f514:beta-closure` |
| `f515-f520-post-beta-plan.mjs` | `prepare:f515-f520:post-beta-plan` |
| `f78-fullstack-db-readiness.mjs` | `prepare:f78:db-fullstack` |

- `manifiesto_gamma.py`: genera `gamma-ingesta.json` (contrato `gamma/ingesta@1`) con las normas de `data/pdf/` para que GAMMA-AI las indexe y RadShieldMx consuma la evidencia citada.
