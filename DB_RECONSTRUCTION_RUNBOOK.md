# RadShield-MX DB reconstruction runbook

This runbook is for a local/test database only. Do not point `DATABASE_URL` to
production during reconstruction.

## Fase 54 scope

Fase 54 prepared the DB reconstruction path for the dosimetry stack added in
Fases 50-53. Fase 71 extends the same reconstruction gate to the workflow tables
added later for controlled-zone persistence, analytic memory snapshots and report
exports.

- F50: Drizzle/MySQL migration for dosimetry tables.
- F51: authenticated `dosimetry` tRPC router.
- F52: Nuclear Medicine UI sync button.
- F53: local queue `radshield_internal_dosimetry_sync_queue_v1`.
- F69/F70: controlled-zone calculations, analytic-memory snapshots, project report
  exports and final UI/deploy stabilization contracts.

The current environment may not have Docker, MySQL CLI or `DATABASE_URL`.
When those are missing, run the static plan first:

```bash
npm run db:reconstruct:plan
```

The plan checks that migrations, seed, compose files, scripts and F50 tables
are present before any DB command is attempted.

## 1. Start local MySQL

First run the preflight:

```bash
npm run db:preflight
```

If Docker is available and no existing MySQL is configured:

```bash
docker compose -f docker-compose.db.yml up -d
```

Expected local test URL:

```env
DATABASE_URL=mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test
```

On PowerShell:

```powershell
$env:DATABASE_URL="mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test"
```

## 2. Verify reconstruction readiness

```bash
npm run db:reconstruct:plan
```

Expected static checks:

- `F50 migration tables`: OK.
- `F50 schema exports`: OK.
- `F50 seed coverage`: OK.
- `F69/F70 workflow migration tables`: OK.
- `F69/F70 workflow schema exports`: OK.
- `Migration journal includes 0002`: OK.
- `DB compose defaults`: OK.
- `package scripts`: OK.

If `DATABASE_URL` is missing, `canRunDatabaseNow` will be `false`. That is a
configuration blocker, not a schema blocker.

## 3. Verify schema drift

```bash
npm run db:generate
```

Expected result while schema is current:

```text
No schema changes, nothing to migrate
```

If Drizzle generates a new migration, inspect it before proceeding.

## 4. Run migrations

```bash
npm run db:migrate
```

This command is intentionally blocked when `DATABASE_URL` is missing.

F50 migration must create:

- `dosimetry_references`
- `dosimetry_phantoms`
- `dosimetry_procedures`
- `dosimetry_effective_coefficients`
- `dosimetry_workspaces`
- `dosimetry_validation_attachments`

F69/F70 workflow migration must create:

- `analytic_memory_snapshots`
- `controlled_zone_calculations`
- `controlled_zone_plans`
- `project_report_exports`

## 5. Seed minimal and dosimetry data

```bash
npm run db:seed
```

The seed is idempotent and uses:

- user `seed-admin`
- source IDs `seed-*`
- dosimetry references from `buildInternalDosimetryDataset`
- 15 phantoms
- 3 procedures
- 23 effective-dose coefficients
- 1 seed dosimetry workspace

## 6. Validate tables and seed rows

```bash
npm run db:validate:live
```

This validates the reconstructed MySQL database directly:

- Required base, dosimetry and workflow tables exist.
- `seed-admin` user exists.
- Seed project, material, calculation, report and RAG chunks exist.
- Dosimetry references, phantoms, procedures, coefficients and seed workspace exist.

## 6A. Seed F75/F76 RAG document chunks

F75/F76 prepares normative and analytical-memory chunks outside the minimal
seed. Run OCR/prepare first:

```bash
npm run prepare:f76:ocr
npm run prepare:f75:pdf-rag
```

If OCR tools are unavailable, place UTF-8 sidecars in:

```text
data/rag/ocr/{documentId}.txt
```

Then run a dry-run seed:

```bash
npm run db:seed:f76:documents
```

The F76 document seed is blocked by default. To insert into `document_chunks`,
configure `DATABASE_URL` and explicitly opt in:

```bash
F76_SEED_LIVE=1 npm run db:seed:f76:documents
```

The live seed deletes and reinserts only the sources present in
`outputs/f75_pdf_ingestion/f75_document_chunks_db_draft.json`; it does not run
the general seed and does not modify unrelated project/user tables.

## 7. Validate backend health

```bash
npm run build:backend
npm run test:backend:health
npm run test:backend:contracts
```

With `DATABASE_URL` configured, `/api/health/db` must return 200.

## 8. Validate dosimetry API manually

After login/auth is available, validate:

- `dosimetry.listReferences`
- `dosimetry.listPhantoms`
- `dosimetry.listProcedures`
- `dosimetry.listCoefficients`
- `dosimetry.upsertWorkspace`
- `dosimetry.listWorkspaces`

The UI path is:

1. Open Nuclear Medicine advanced dialog.
2. Go to MIRD.
3. Click `Sync DB`.
4. If unauthenticated, the workspace remains in
   `radshield_internal_dosimetry_sync_queue_v1`.
5. After authentication/backend availability, click `Reintentar Cola`.
6. Confirm `DB/API: Sincronizado con DB`.

## 9. Enable frontend backend bridge

Only after migrations, seed and backend health pass:

```env
VITE_ENABLE_BACKEND=true
VITE_BACKEND_URL=http://127.0.0.1:3000/api/trpc
```

Then rebuild the frontend.

## Full local stack

After DB migration/seed passes, the full stack compose can be used:

```bash
docker compose up -d --build
```

Expected services:

- Frontend: `http://127.0.0.1:8080`
- API health: `http://127.0.0.1:3000/health`
- API DB health: `http://127.0.0.1:3000/api/health/db`
- MySQL: `127.0.0.1:3306`

The full stack compose does not run migrations automatically. Run `db:migrate`
and `db:seed` explicitly before relying on API persistence.

## Stop local DB

```bash
docker compose -f docker-compose.db.yml down
```

To delete the test DB volume:

```bash
docker compose -f docker-compose.db.yml down -v
```
