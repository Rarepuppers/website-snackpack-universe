param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("win", "linux", "mac")]
  [string]$Platform
)

$ErrorActionPreference = "Stop"
$desktopRoot = Split-Path -Parent $PSScriptRoot
$gameRoot = Split-Path -Parent $desktopRoot
$stageRoot = Join-Path $desktopRoot "stage"
$stageGame = Join-Path $stageRoot "game"
$stageInput = Join-Path $stageRoot "steam-input"
$cacheRoot = Join-Path $desktopRoot ".cache"
$env:ELECTRON_CACHE = Join-Path $cacheRoot "electron"
$env:ELECTRON_BUILDER_CACHE = Join-Path $cacheRoot "electron-builder"
$env:electron_config_cache = $env:ELECTRON_CACHE
$env:LOCALAPPDATA = Join-Path $cacheRoot "local-app-data"
New-Item -ItemType Directory -Path $env:ELECTRON_CACHE, $env:ELECTRON_BUILDER_CACHE, $env:LOCALAPPDATA -Force | Out-Null

Push-Location (Join-Path $gameRoot "dev")
try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "Web production build failed." }
}
finally { Pop-Location }

Push-Location $desktopRoot
try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "Desktop TypeScript build failed." }
}
finally { Pop-Location }

if (Test-Path -LiteralPath $stageRoot) {
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stageGame, $stageInput -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $gameRoot "index.html") -Destination $stageGame
Copy-Item -LiteralPath (Join-Path $gameRoot "last-bastion-codex.html") -Destination $stageGame
Copy-Item -LiteralPath (Join-Path $gameRoot "game-assets") -Destination $stageGame -Recurse
Copy-Item -Path (Join-Path $gameRoot "steam-input\*") -Destination $stageInput -Recurse

Push-Location $desktopRoot
try {
  $platformSwitch = "--$Platform"
  & npx.cmd electron-builder $platformSwitch dir --publish never
  if ($LASTEXITCODE -ne 0) { throw "Electron packaging failed for $Platform." }
}
finally { Pop-Location }
