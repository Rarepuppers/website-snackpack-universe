$ErrorActionPreference = 'Stop'

$siteRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')
$processInfo = [System.Diagnostics.ProcessStartInfo]::new()
$processInfo.FileName = 'C:\Python314\python.exe'
$processInfo.Arguments = "-m http.server 4173 --bind 127.0.0.1 --directory `"$siteRoot`""
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$server = [System.Diagnostics.Process]::Start($processInfo)

try {
  Start-Sleep -Milliseconds 500

  $page = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173/play/last-bastion/'
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

  $asset = Invoke-WebRequest -UseBasicParsing ("http://127.0.0.1:4173$assetPath")

  [pscustomobject]@{
    PageStatus = $page.StatusCode
    ContentType = $page.Headers['Content-Type']
    HasGameRoot = $true
    AssetPath = $assetPath
    AssetStatus = $asset.StatusCode
    AssetBytes = $asset.RawContentLength
  }
}
finally {
  if (-not $server.HasExited) {
    $server.Kill()
    $server.WaitForExit()
  }
}
