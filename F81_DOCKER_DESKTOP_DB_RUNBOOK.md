# F81 Docker Desktop DB runbook

Decision: use Docker Desktop as the preferred local DB path for RadShield-MX.

Why Docker first:

- Reproducible MySQL 8 environment for tests and release candidates.
- Matches the existing `docker-compose.db.yml`.
- Avoids installing a global Windows MySQL service.
- Makes DB reset/reconstruction safer during RAG, seed and schema validation.

## Prerequisites

Install and open Docker Desktop. Wait until Docker reports the engine is running.

Validate from PowerShell:

```powershell
docker version
docker compose version
```

If Docker is installed but the command reports:

```text
permission denied while trying to connect to the docker API at npipe:////./pipe/docker_engine
```

then the current Windows user/session cannot access Docker Desktop's engine.
Add the user/session to Docker Desktop access, usually the `docker-users` group,
then sign out/sign in or restart Docker Desktop. In this Codex sandbox the user
is `Eduardo81\CodexSandboxUsers`, so the command may need to be run from a normal
PowerShell session with Docker access.

## Start MySQL

From the project root:

```powershell
node scripts\f81-start-local-mysql.mjs
```

If `npm` is available, the equivalent package script is:

```powershell
npm run db:start:f81
```

If Docker is available, the script attempts:

```powershell
docker compose -f docker-compose.db.yml up -d
```

If Codex cannot access Docker's named pipe but Docker Desktop works in a normal
PowerShell terminal, run the host helper:

```powershell
.\scripts\f81-host-docker-reconstruct.ps1
```

That helper starts MySQL, waits for port `3306`, runs migrations, seeds the base
DB, seeds F75/F76 RAG chunks and validates the live DB.

### If `mysql:8.0` pull fails

If PowerShell shows a failure like:

```text
Image mysql:8.0 Pulling
failed to copy: httpReadSeeker: failed open: failed to do request: Get "https://production.cloudfront.docker.com/..."
```

Docker Desktop has engine access, but the image download is blocked or unstable
at the Docker Hub/CloudFront network layer. The app configuration is still OK.

Recommended options, in order:

1. Open Docker Desktop, confirm it is signed in if required by the environment,
   then retry:

   ```powershell
   docker pull mysql:8.0
   .\scripts\f81-host-docker-reconstruct.ps1
   ```

2. If a firewall/proxy/antivirus blocks Docker Hub or CloudFront, allow Docker
   Desktop access to `registry-1.docker.io`, `auth.docker.io` and
   `production.cloudfront.docker.com`, then retry the pull.

3. If internet pull is not possible on this machine, load the image offline:

   ```powershell
   docker load -i C:\path\to\mysql-8.0.tar
   .\scripts\f81-host-docker-reconstruct.ps1
   ```

   The tar can be created on another machine with:

   ```powershell
   docker pull mysql:8.0
   docker save mysql:8.0 -o mysql-8.0.tar
   ```

4. If Docker cannot be used, point `.env` `DATABASE_URL` to an existing MySQL 8
   compatible server, then run the migration/seed commands below.

The helper uses a direct TCP socket check for `127.0.0.1:3306`; it does not rely
on `Test-NetConnection` ICMP/ping output.

Expected DB target:

```text
mysql://radshield:***@127.0.0.1:3306/radshield_mx_test
```

## Reconstruct and seed

Run in order:

```powershell
node scripts\db-preflight.mjs
.\node_modules\.bin\drizzle-kit.cmd migrate
node scripts\run-seed.mjs
$env:F76_SEED_LIVE='1'; node scripts\f76-seed-document-chunks.mjs
node scripts\db-live-validation.mjs
```

## Enable backend bridge only after live validation

Update `.env` only after DB validation passes:

```text
VITE_ENABLE_BACKEND=true
VITE_BACKEND_URL=http://127.0.0.1:3000
```

Then rebuild frontend and rerun release validation.

## Current blocker

As of F81, Docker CLI is visible but this Codex sandbox cannot access
`\\.\pipe\docker_engine`. MySQL CLI/`mysqld` are not available, WSL has no
distribution, `DATABASE_URL` is configured, and `127.0.0.1:3306` is not reachable.
