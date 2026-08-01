param(
  [string]$FfmpegPath = "C:\Users\carlo\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe",
  [string]$OutputDir = "C:\Users\carlo\Documents\Codex\2026-07-03\ana\work\recovery-app\outputs\f414_bim_video_reference"
)

$ErrorActionPreference = "Stop"

$videos = @(
  @{ Id = "v1"; Path = "C:\Users\carlo\Downloads\WhatsApp Video 2026-07-31 at 6.40.22 PM.mp4" },
  @{ Id = "v2"; Path = "C:\Users\carlo\Downloads\WhatsApp Video 2026-07-31 at 6.40.23 PM.mp4" },
  @{ Id = "v3"; Path = "C:\Users\carlo\Downloads\WhatsApp Video 2026-07-31 at 6.34.29 PM.mp4" }
)

if (-not (Test-Path -LiteralPath $FfmpegPath)) {
  throw "ffmpeg.exe not found at $FfmpegPath"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

foreach ($video in $videos) {
  if (-not (Test-Path -LiteralPath $video.Path)) {
    Write-Warning "Missing video: $($video.Path)"
    continue
  }

  $pattern = Join-Path $OutputDir "$($video.Id)_frame_%03d.jpg"
  & $FfmpegPath -y -i $video.Path -vf "fps=1/3,scale=1280:-1" $pattern
}

Get-ChildItem -LiteralPath $OutputDir -Filter "*.jpg" |
  Sort-Object Name |
  Select-Object FullName, Length
