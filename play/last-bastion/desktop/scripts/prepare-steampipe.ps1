param(
  [Parameter(Mandatory = $true)][ValidatePattern("^[1-9][0-9]*$")][string]$AppId,
  [Parameter(Mandatory = $true)][ValidatePattern("^[1-9][0-9]*$")][string]$DepotId,
  [Parameter(Mandatory = $true)][string]$PackageDir,
  [string]$Description = "Last Bastion candidate",
  [switch]$Preview
)

$ErrorActionPreference = "Stop"
if ($Description -match '["\r\n]') { throw "Description cannot contain quotes or line breaks." }
$desktopRoot = Split-Path -Parent $PSScriptRoot
$steamPipeRoot = Join-Path $desktopRoot "steampipe"
$templateRoot = Join-Path $steamPipeRoot "templates"
$workRoot = Join-Path $steamPipeRoot "work"
$contentRoot = Join-Path $workRoot "content"
$scriptsRoot = Join-Path $workRoot "scripts"
$outputRoot = Join-Path $workRoot "output"
$resolvedPackage = (Resolve-Path -LiteralPath $PackageDir).Path
if (-not (Test-Path -LiteralPath $resolvedPackage -PathType Container)) {
  throw "PackageDir must be a packaged Electron directory."
}

if (Test-Path -LiteralPath $workRoot) {
  Remove-Item -LiteralPath $workRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $contentRoot, $scriptsRoot, $outputRoot -Force | Out-Null
Copy-Item -Path (Join-Path $resolvedPackage "*") -Destination $contentRoot -Recurse

$previewLine = if ($Preview) { '  "Preview" "1"' } else { "" }
$appTemplate = Get-Content -LiteralPath (Join-Path $templateRoot "app_build.vdf.in") -Raw -Encoding utf8
$appConfig = $appTemplate.Replace("__APP_ID__", $AppId).
  Replace("__DEPOT_ID__", $DepotId).
  Replace("__DESCRIPTION__", $Description).
  Replace("__PREVIEW_LINE__", $previewLine)
$depotTemplate = Get-Content -LiteralPath (Join-Path $templateRoot "depot_build.vdf.in") -Raw -Encoding utf8
$depotConfig = $depotTemplate.Replace("__DEPOT_ID__", $DepotId)
Set-Content -LiteralPath (Join-Path $scriptsRoot "app_build.vdf") -Value $appConfig -Encoding utf8NoBOM
Set-Content -LiteralPath (Join-Path $scriptsRoot "depot_build.vdf") -Value $depotConfig -Encoding utf8NoBOM

Write-Output "SteamPipe work tree prepared at $workRoot"
Write-Output "Preview: $($Preview.IsPresent); no upload was performed."
