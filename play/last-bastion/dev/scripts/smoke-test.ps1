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
    'quillback-effect-atlas-v1-64.png',
    'spinewheel-spritesheet-v1-96.png',
    'spinewheel-shell-spin-v1-96.png',
    'spinewheel-effect-atlas-v1-64.png',
    'tether-bloom-spritesheet-v1-96.png',
    'tether-bloom-effect-atlas-v1-64.png',
    'bastion-eater-spritesheet-v1-192.png',
    'bastion-eater-node-overlay-v1-192.png',
    'bastion-eater-effect-atlas-v1-96.png',
    'bastion-eater-environment-atlas-v1-96.png',
    'bastion-eater-portrait-v1-256.png',
    'patrol-blade-spritesheet-v1-96.png',
    'patrol-blade-effect-atlas-v1-64.png',
    'action-tile-atlas-v1-64.png',
    'uranium-core-rounds-status-v1-64.png',
    'bolt-carbine-spritesheet-v1-96.png',
    'bolt-carbine-effect-atlas-v1-64.png',
    'weapon-tile-atlas-v1-64.png',
    'bulwark-rotary-cannon-spritesheet-v1-96.png',
    'bulwark-rotary-cannon-effect-atlas-v1-64.png',
    'grenade-tube-spritesheet-v1-96.png',
    'grenade-tube-effect-atlas-v1-64.png',
    'status-effect-overlay-atlas-v1-48.png',
    'event-horizon-spritesheet-v1-96.png',
    'event-horizon-effect-atlas-v1-64.png',
    'event-horizon-tile-v1-64.png',
    'corrupted-human-survivor-spritesheet-v1-96.png',
    'corrupted-marine-spritesheet-v1-96.png',
    'abomination-spritesheet-v1-128.png',
    'corrupted-marine-effect-atlas-v1-64.png',
    'emberfall-floor-atlas-v1-64.png',
    'emberfall-boundary-atlas-v1-64.png',
    'emberfall-obstacle-atlas-v1-96.png',
    'emberfall-decal-atlas-v1-64.png',
    'toxic-bloom-floor-atlas-v1-64.png',
    'toxic-bloom-boundary-atlas-v1-64.png',
    'toxic-bloom-obstacle-atlas-v1-96.png',
    'toxic-bloom-decal-atlas-v1-64.png',
    'void-approach-floor-atlas-v1-64.png',
    'void-approach-boundary-atlas-v1-64.png',
    'void-approach-obstacle-atlas-v1-96.png',
    'void-approach-decal-atlas-v1-64.png',
    'arctic-relay-floor-atlas-v1-64.png',
    'arctic-relay-boundary-atlas-v1-64.png',
    'arctic-relay-obstacle-atlas-v1-96.png',
    'arctic-relay-decal-atlas-v1-64.png'
    'aurum-hoarder-spritesheet-v1-96.png'
    'aurum-hoarder-effect-atlas-v1-64.png'
    'aurum-tile-atlas-v1-128.png'
    'tiles/mon-aurum-hoarder-v1.png'
    'scrap-shop-offer-tile-atlas-v1-128.png'
    'scrap-shop-hud-atlas-v1-128.png'
    'scrap-shop-panel-v1-1024x576.png'
    'swarm-scuttler-spritesheet-v1-64.png'
    'razorlord-spritesheet-v1-96.png'
    'blightspitter-spritesheet-v1-96.png'
    'quillback-matriarch-spritesheet-v1-128.png'
    'telegraph-large-atlas-v1-128.png'
    'telegraph-small-atlas-v1-64.png'
    'telegraph-danger-fill-v1-64.png'
    'science-wing-floor-v1-128.png'
    'science-wing-boundary-v1-128.png'
    'science-wing-fixtures-v1-192.png'
    'science-wing-decals-v1-128.png'
    'bastion-logistics-floor-v1-128.png'
    'bastion-logistics-boundary-v1-128.png'
    'bastion-logistics-fixtures-v1-192.png'
    'bastion-logistics-decals-v1-128.png'
    'machine-foundry-floor-v1-128.png'
    'machine-foundry-boundary-v1-128.png'
    'machine-foundry-fixtures-v1-192.png'
    'machine-foundry-decals-v1-128.png'
    'alien-hive-floor-v1-128.png'
    'alien-hive-boundary-v1-128.png'
    'alien-hive-fixtures-v1-192.png'
    'alien-hive-decals-v1-128.png'
    'surface-frontier-floor-v1-128.png'
    'surface-frontier-boundary-v1-128.png'
    'surface-frontier-fixtures-v1-192.png'
    'surface-frontier-decals-v1-128.png'
    'starship-transit-floor-v1-128.png'
    'starship-transit-boundary-v1-128.png'
    'starship-transit-fixtures-v1-192.png'
    'starship-transit-decals-v1-128.png'
    'containment-underworld-floor-v1-128.png'
    'containment-underworld-boundary-v1-128.png'
    'containment-underworld-fixtures-v1-192.png'
    'containment-underworld-decals-v1-128.png'
    'world-objects-military-v1-192.png'
    'world-objects-natural-v1-192.png'
    'world-objects-organic-v1-192.png'
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
    '/play/last-bastion/?mode=gallery&batch=d3',
    '/play/last-bastion/?mode=gallery&batch=d4',
    '/play/last-bastion/?mode=gallery&batch=e1',
    '/play/last-bastion/?mode=gallery&batch=e2',
    '/play/last-bastion/?mode=gallery&batch=e3',
    '/play/last-bastion/?mode=gallery&batch=f1',
    '/play/last-bastion/?mode=gallery&batch=f2',
    '/play/last-bastion/?mode=gallery&batch=f3',
    '/play/last-bastion/?mode=gallery&batch=f4',
    '/play/last-bastion/?mode=gallery&batch=k',
    '/play/last-bastion/?mode=gallery&batch=eh',
    '/play/last-bastion/?mode=gallery&batch=m',
    '/play/last-bastion/?mode=gallery&batch=h',
    '/play/last-bastion/?mode=gallery&batch=tb',
    '/play/last-bastion/?mode=gallery&batch=va',
    '/play/last-bastion/?mode=gallery&batch=ar',
    '/play/last-bastion/?mode=gallery&batch=n',
    '/play/last-bastion/?mode=gallery&batch=n2',
    '/play/last-bastion/?mode=gallery&batch=j1',
    '/play/last-bastion/?mode=gallery&batch=j2',
    '/play/last-bastion/?mode=gallery&batch=ad',
    '/play/last-bastion/?mode=gallery&batch=ae',
    '/play/last-bastion/?mode=gallery&batch=af',
    '/play/last-bastion/?mode=gallery&batch=ag',
    '/play/last-bastion/?mode=gallery&batch=ah',
    '/play/last-bastion/?mode=gallery&batch=ai',
    '/play/last-bastion/?mode=gallery&batch=aj',
    '/play/last-bastion/?mode=gallery&batch=o1',
    '/play/last-bastion/?screen=transformation-lab',
    '/play/last-bastion/?theme=science-wing&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=bastion-logistics&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=machine-foundry&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=alien-hive&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=surface-frontier&biome=cracked-earth&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=surface-frontier&biome=frozen-ground&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=surface-frontier&biome=ruined-settlement&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=surface-frontier&biome=crystal-badlands&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=starship-transit&room=operational-deck&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=starship-transit&room=command-deck&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=starship-transit&room=energy-transit&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=starship-transit&room=derelict-deck&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=containment-underworld&room=institutional-wing&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=containment-underworld&room=containment-vault&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=containment-underworld&room=dungeon-depths&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?theme=containment-underworld&room=infernal-facility&worldseed=0&scenario=density-capacity',
    '/play/last-bastion/?loadout=vertical',
    '/play/last-bastion/?loadout=patrol',
    '/play/last-bastion/?loadout=bolt',
    '/play/last-bastion/?loadout=bulwark',
    '/play/last-bastion/?loadout=grenade',
    '/play/last-bastion/?loadout=patrol&kit=uranium',
    '/play/last-bastion/?loadout=patrol&buff=uranium',
    '/play/last-bastion/?scenario=slime-spitter&loadout=vertical',
    '/play/last-bastion/?scenario=carapace-elite&loadout=vertical',
    '/play/last-bastion/?scenario=siege-crusher&loadout=vertical',
    '/play/last-bastion/?scenario=brood-warden&loadout=vertical',
    '/play/last-bastion/?scenario=ripper&loadout=vertical',
    '/play/last-bastion/?scenario=razor-scuttler&loadout=vertical',
    '/play/last-bastion/?scenario=quillback&loadout=vertical',
    '/play/last-bastion/?scenario=spinewheel&loadout=vertical',
    '/play/last-bastion/?scenario=tether-bloom&loadout=vertical',
    '/play/last-bastion/?scenario=bastion-eater&loadout=vertical',
    '/play/last-bastion/?scenario=density-capacity&debug=1',
    '/play/last-bastion/?scenario=aurum-hoarder&loadout=bulwark',
    '/play/last-bastion/?scenario=scrap-shop&loadout=vertical',
    '/play/last-bastion/?scenario=batch-j&loadout=vertical',
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
