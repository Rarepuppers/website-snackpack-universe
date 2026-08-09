[CmdletBinding()]
param(
  [string]$FfmpegPath = "ffmpeg"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$masters = Join-Path $projectRoot "audio/production/batch-c3-tactician/masters"
$runtime = Join-Path $projectRoot "dev/src/game/audio/runtime/batch-c3-tactician"
$gameAssets = Join-Path $projectRoot "game-assets"

& $FfmpegPath -version | Select-Object -First 1 | Out-Host
if ($LASTEXITCODE -ne 0) { throw "FFmpeg is unavailable at $FfmpegPath" }

New-Item -ItemType Directory -Force -Path $runtime | Out-Null
foreach ($wav in Get-ChildItem -LiteralPath $masters -Filter "*.wav" -File | Sort-Object Name) {
  $stem = [IO.Path]::GetFileNameWithoutExtension($wav.Name)
  $ogg = Join-Path $runtime "$stem.ogg"
  $mp3 = Join-Path $runtime "$stem.mp3"
  & $FfmpegPath -hide_banner -loglevel error -y -i $wav.FullName -map_metadata -1 -c:a libvorbis -q:a 5 $ogg
  if ($LASTEXITCODE -ne 0) { throw "OGG encoding failed for $($wav.Name)" }
  & $FfmpegPath -hide_banner -loglevel error -y -i $wav.FullName -map_metadata -1 -c:a libmp3lame -q:a 4 $mp3
  if ($LASTEXITCODE -ne 0) { throw "MP3 encoding failed for $($wav.Name)" }
  Copy-Item -LiteralPath $ogg -Destination (Join-Path $gameAssets "$stem.ogg") -Force
  Copy-Item -LiteralPath $mp3 -Destination (Join-Path $gameAssets "$stem.mp3") -Force
  Write-Output "ENCODED batch-c3-tactician/$stem"
}

Write-Output "C3 Tactician encoding complete. Run npm.cmd run audio:audit:c3-tactician -- -FfmpegPath <path>."
