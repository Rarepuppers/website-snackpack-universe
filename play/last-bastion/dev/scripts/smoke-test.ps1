$ErrorActionPreference = 'Stop'

$siteRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')
$port = 44173
$processInfo = [System.Diagnostics.ProcessStartInfo]::new()
$processInfo.FileName = 'C:\Python314\python.exe'
$processInfo.Arguments = "-m http.server $port --bind 127.0.0.1 --directory `"$siteRoot`""
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$server = [System.Diagnostics.Process]::Start($processInfo)

try {
  $page = $null
  for ($attempt = 0; $attempt -lt 20 -and $null -eq $page; $attempt += 1) {
    try {
      $page = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$port/play/last-bastion/"
    }
    catch {
      Start-Sleep -Milliseconds 150
    }
  }
  if ($null -eq $page) {
    throw 'Local smoke server did not become ready.'
  }
  $assetPath = [regex]::Match(
    $page.Content,
    '/play/last-bastion/game-assets/[^"'']+\.js'
  ).Value

  if (-not $page.Content.Contains('id="game-root"')) {
    throw 'Built page is missing #game-root.'
  }

  if (-not $assetPath) {
    throw 'Built page does not reference a JavaScript game asset.'
  }

  $asset = Invoke-WebRequest -UseBasicParsing ("http://127.0.0.1:$port$assetPath")
  $requiredArtAssets = @(
    'bastion-service-rifle-gameplay-v1-64.png',
    'brain-blob-states-v1-64.png',
    'egg-cluster-spritesheet-v1-64.png',
    'marine-base-spritesheet-v1-96.png',
    'marine-bastion-helmet-overlay-v1-96.png',
    'scuttler-spritesheet-v1-64.png',
    'arena-floor-atlas-v1-64.png',
    'arena-boundary-atlas-v1-64.png',
    'arena-obstacle-atlas-v1-96.png',
    'combat-effect-atlas-v1-64.png',
    'pickup-atlas-v1-64.png',
    'hud-panel-atlas-v1-256x128.png',
    'scattergun-gameplay-v1-64.png',
    'arc-carbine-gameplay-v1-64.png',
    'slime-spitter-spritesheet-v1-64.png',
    'carapace-scuttler-spritesheet-v1-96.png',
    'siege-crusher-spritesheet-v1-128.png',
    'batch-b-effect-atlas-v1-64.png',
    'siege-crusher-portrait-v1-128.png',
    'blast-mite-spritesheet-v1-64.png',
    'warp-flanker-spritesheet-v1-96.png',
    'batch-c-reward-atlas-v1-64.png',
    'batch-c-effect-atlas-v1-64.png',
    'brood-warden-spritesheet-v1-128.png',
    'brood-warden-portrait-v1-128.png',
    'brood-warden-effect-atlas-v1-64.png',
    'ripper-spritesheet-v1-96.png',
    'ripper-effect-atlas-v1-64.png',
    'quillback-spritesheet-v1-96.png',
    'quillback-effect-atlas-v1-64.png'
  )

  foreach ($artAssetName in $requiredArtAssets) {
    $artResponse = Invoke-WebRequest -UseBasicParsing (
      "http://127.0.0.1:$port/play/last-bastion/game-assets/$artAssetName"
    )
    if ($artResponse.StatusCode -ne 200 -or $artResponse.RawContentLength -le 0) {
      throw "Required art asset failed HTTP verification: $artAssetName"
    }
  }

  $reviewRoutes = @(
    '/play/last-bastion/?art=placeholder',
    '/play/last-bastion/?mode=gallery',
    '/play/last-bastion/?mode=gallery&batch=a',
    '/play/last-bastion/?mode=gallery&batch=b',
    '/play/last-bastion/?mode=gallery&batch=c',
    '/play/last-bastion/?mode=gallery&batch=d',
    '/play/last-bastion/?mode=gallery&batch=d2',
    '/play/last-bastion/?mode=gallery&batch=e1',
    '/play/last-bastion/?loadout=vertical',
    '/play/last-bastion/?scenario=slime-spitter&loadout=vertical',
    '/play/last-bastion/?scenario=carapace-elite&loadout=vertical',
    '/play/last-bastion/?scenario=siege-crusher&loadout=vertical',
    '/play/last-bastion/?scenario=brood-warden&loadout=vertical',
    '/play/last-bastion/?scenario=ripper&loadout=vertical',
    '/play/last-bastion/?scenario=quillback&loadout=vertical',
    '/play/last-bastion/?scenario=spinewheel&loadout=vertical',
    '/play/last-bastion/?stress=4',
    '/play/last-bastion/?stress=12'
  )
  foreach ($reviewRoute in $reviewRoutes) {
    $routeResponse = Invoke-WebRequest -UseBasicParsing ("http://127.0.0.1:$port$reviewRoute")
    if ($routeResponse.StatusCode -ne 200 -or -not $routeResponse.Content.Contains('id="game-root"')) {
      throw "Review route failed HTTP verification: $reviewRoute"
    }
  }

  [pscustomobject]@{
    PageStatus = $page.StatusCode
    ContentType = $page.Headers['Content-Type']
    HasGameRoot = $true
    AssetPath = $assetPath
    AssetStatus = $asset.StatusCode
    AssetBytes = $asset.RawContentLength
    ArtAssetCount = $requiredArtAssets.Count
    ReviewRouteCount = $reviewRoutes.Count + 1
  }
}
finally {
  if (-not $server.HasExited) {
    $server.Kill()
    $server.WaitForExit()
  }
}
