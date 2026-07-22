$ErrorActionPreference = 'Stop'

$builtRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$indexPath = Join-Path $builtRoot 'index.html'
$bundlePath = Join-Path $builtRoot 'game-assets\game.js'

if (-not (Test-Path -LiteralPath $indexPath) -or -not (Test-Path -LiteralPath $bundlePath)) {
  throw 'Production output is missing. Run npm.cmd run build before the offline audit.'
}

$index = Get-Content -Raw -LiteralPath $indexPath
$bundle = Get-Content -Raw -LiteralPath $bundlePath
$sourceRoot = Resolve-Path (Join-Path $PSScriptRoot '..\src')
$sourceFiles = Get-ChildItem -LiteralPath $sourceRoot -Recurse -File -Include *.ts,*.tsx,*.css,*.html

$externalDocumentRefs = [regex]::Matches($index, '(?:src|href)=["''](https?:)?//[^"'']+["'']')
if ($externalDocumentRefs.Count -gt 0) {
  throw "Built document has external runtime dependencies: $($externalDocumentRefs.Value -join ', ')"
}

$remoteSourceImports = $sourceFiles | Select-String -Pattern '(?:from\s+|import\s*\(|url\s*\()["'']https?://' -AllMatches
if ($remoteSourceImports) {
  throw "Source contains remote imports/assets: $($remoteSourceImports.Path -join ', ')"
}

$networkStartupPatterns = @(
  'fetch\(["'']https?://',
  'new\s+WebSocket\(["''](?:wss?|https?)://',
  'new\s+EventSource\(["'']https?://',
  'import\(["'']https?://'
)
foreach ($pattern in $networkStartupPatterns) {
  if ([regex]::IsMatch($bundle, $pattern)) {
    throw "Production bundle contains a remote startup call matching: $pattern"
  }
}

$assetRefs = [regex]::Matches($bundle, '/play/last-bastion/game-assets/[^"''`\s)]+') |
  ForEach-Object { $_.Value } | Sort-Object -Unique
$missing = @()
foreach ($assetRef in $assetRefs) {
  $relative = $assetRef.Substring('/play/last-bastion/'.Length).Replace('/', [IO.Path]::DirectorySeparatorChar)
  $resolved = Join-Path $builtRoot $relative
  if (-not (Test-Path -LiteralPath $resolved)) { $missing += $assetRef }
}
if ($missing.Count -gt 0) {
  throw "Bundle references missing local assets: $($missing -join ', ')"
}

[pscustomobject]@{
  OfflineDocument = $true
  RemoteImports = 0
  RemoteStartupCalls = 0
  LocalAssetReferences = $assetRefs.Count
  MissingLocalAssets = 0
}
