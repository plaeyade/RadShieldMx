$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$BundledNode = "C:\Users\carlo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if (Test-Path -LiteralPath $BundledNode) {
  $env:PATH = "$BundledNode;$env:PATH"
}

$env:DOCKER_CONFIG = Join-Path $Root ".docker-cli-config"
New-Item -ItemType Directory -Force $env:DOCKER_CONFIG | Out-Null

function Test-TcpPort {
  param(
    [Parameter(Mandatory = $true)][string]$HostName,
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutMs = 1500
  )

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
      return $false
    }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

Write-Host "[F81] Docker version"
docker version
docker compose version

Write-Host "[F81] Checking mysql:8.0 image"
docker image inspect mysql:8.0 *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[F81] Pulling mysql:8.0"
  docker pull mysql:8.0
  if ($LASTEXITCODE -ne 0) {
    throw "Docker could not pull mysql:8.0. Check Docker Desktop network/proxy/firewall access to Docker Hub/CloudFront, or load mysql:8.0 from an offline tar image."
  }
}

Write-Host "[F81] Starting MySQL test database"
docker compose -f docker-compose.db.yml up -d

Write-Host "[F81] Waiting for 127.0.0.1:3306"
for ($i = 0; $i -lt 60; $i++) {
  if (Test-TcpPort -HostName "127.0.0.1" -Port 3306) {
    break
  }
  Start-Sleep -Seconds 2
}

if (-not (Test-TcpPort -HostName "127.0.0.1" -Port 3306)) {
  docker compose -f docker-compose.db.yml ps
  docker compose -f docker-compose.db.yml logs --tail 80 db
  throw "MySQL did not become reachable at 127.0.0.1:3306."
}

node scripts\db-preflight.mjs
.\node_modules\.bin\drizzle-kit.cmd migrate
node scripts\run-seed.mjs
$env:F76_SEED_LIVE = "1"
node scripts\f76-seed-document-chunks.mjs
node scripts\db-live-validation.mjs

Write-Host "[F81] Database reconstruction and seed completed."
