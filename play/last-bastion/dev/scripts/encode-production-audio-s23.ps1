param(
  [string]$FfmpegPath = "ffmpeg"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$batches = @("batch-s2", "batch-s3")
$runtimeRoot = Join-Path $projectRoot "dev/src/game/audio/runtime"
$gameAssets = Join-Path $projectRoot "game-assets"

& $FfmpegPath -version | Select-Object -First 1 | Out-Host
foreach ($batch in $batches) {
  $masters = Join-Path $projectRoot "audio/production/$batch/masters"
  $runtime = Join-Path $runtimeRoot $batch
  New-Item -ItemType Directory -Force -Path $runtime | Out-Null
  foreach ($wav in Get-ChildItem -LiteralPath $masters -Filter "*.wav" -File | Sort-Object Name) {
    $stem = [IO.Path]::GetFileNameWithoutExtension($wav.Name)
    $ogg = Join-Path $runtime "$stem.ogg"
    $mp3 = Join-Path $runtime "$stem.mp3"
    & $FfmpegPath -hide_banner -loglevel error -y -i $wav.FullName -map_metadata -1 -c:a libvorbis -q:a 5 $ogg
    if ($LASTEXITCODE -ne 0) { throw "OGG encoding failed for $($wav.Name)" }
    & $FfmpegPath -hide_banner -loglevel error -y -i $wav.FullName -map_metadata -1 -c:a libmp3lame -q:a 4 $mp3
    if ($LASTEXITCODE -ne 0) { throw "MP3 encoding failed for $($wav.Name)" }
    Copy-Item -LiteralPath $ogg -Destination (Join-Path $gameAssets $ogg | Split-Path -Leaf) -Force
    Copy-Item -LiteralPath $mp3 -Destination (Join-Path $gameAssets $mp3 | Split-Path -Leaf) -Force
    Write-Output "ENCODED $batch/$stem"
  }
}

Write-Output "S2/S3 encoding complete. Run npm.cmd run audio:audit:s23 and npm.cmd run typecheck from dev/."
