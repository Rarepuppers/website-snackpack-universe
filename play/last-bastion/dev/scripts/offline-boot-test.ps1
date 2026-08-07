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

# What this check is for: the GAME must boot with no remote dependency. Until
# 7 Aug 2026 the build overwrote the published index.html with a bare prototype
# shell, so this only ever inspected a document that never shipped. Now that it
# sees the real page, the rule has to distinguish two things the old regex
# conflated:
#   - blocking runtime dependencies (render-blocking scripts, stylesheets,
#     fonts, startup images) -> still a hard failure
#   - metadata and deferred analytics (canonical, og:image, twitter:image, the
#     defer'd Cloudflare beacon) -> present on the live page by design, and
#     none of them gate the game booting offline
$blockingDocumentRefs = [regex]::Matches(
  $index,
  '<(?:script|link|img)\b[^>]*(?:src|href)=["''](?:https?:)?//[^"'']+["''][^>]*>'
) | Where-Object {
  $tag = $_.Value
  $isMetadataLink = $tag -match '<link\b' -and $tag -match 'rel=["''](?:canonical|alternate|dns-prefetch|preconnect)["'']'
  $isDeferredAnalytics = $tag -match '<script\b' -and $tag -match '\bdefer\b'
  -not ($isMetadataLink -or $isDeferredAnalytics)
}
if ($blockingDocumentRefs.Count -gt 0) {
  throw "Built document has blocking external runtime dependencies: $(($blockingDocumentRefs | ForEach-Object { $_.Value }) -join ', ')"
}

# The published page must keep the markup that makes it discoverable; a build
# that quietly drops it is the regression this guard exists to catch.
foreach ($required in @('rel="canonical"', 'og:title', '<title>')) {
  if ($index -notmatch [regex]::Escape($required)) {
    throw "Built document is missing required production markup: $required"
  }
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

# Every emitted chunk, not just the entry: code splitting moved the asset URLs
# into GameAssetManifest/PhaserAssetLoader, so scanning game.js alone silently
# audited nothing and this check reported zero references.
$chunkFiles = Get-ChildItem -LiteralPath (Join-Path $builtRoot 'game-assets') -File -Filter *.js
$chunkText = ($chunkFiles | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n"
$assetRefs = [regex]::Matches($chunkText, '/play/last-bastion/game-assets/[^"''`\s)]+') |
  ForEach-Object { $_.Value } | Sort-Object -Unique
if ($assetRefs.Count -lt 100) {
  throw "Offline audit found only $($assetRefs.Count) local asset references; the bundle scan is not seeing the manifest chunks."
}
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
