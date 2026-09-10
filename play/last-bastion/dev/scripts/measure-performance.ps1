$ErrorActionPreference = 'Stop'

$webRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$siteRoot = Resolve-Path (Join-Path $webRoot '..\..\..')
$browserRoot = Join-Path $siteRoot '.playwright-browsers'
$testPort = 44176
$outputArguments = @()
if ($args.Count -gt 0) { $outputArguments = $args }

if (-not (Test-Path -LiteralPath $browserRoot)) {
  throw "Repository Playwright browsers are missing: $browserRoot"
}

$previousBrowserRoot = $env:PLAYWRIGHT_BROWSERS_PATH
$previousPerformanceUrl = $env:LAST_BASTION_PERFORMANCE_URL
$previousPort = $env:PORT
$server = $null
try {
  $env:PLAYWRIGHT_BROWSERS_PATH = $browserRoot
  $env:LAST_BASTION_PERFORMANCE_URL = "http://127.0.0.1:$testPort"
  $env:PORT = [string]$testPort
  $node = (Get-Command node -ErrorAction Stop).Source
  $server = Start-Process -FilePath $node `
    -ArgumentList 'scripts/serve-static.mjs' `
    -WorkingDirectory $siteRoot `
    -WindowStyle Hidden `
    -PassThru
  $ready = $false
  for ($attempt = 0; $attempt -lt 30 -and -not $ready; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 "http://127.0.0.1:$testPort/play/last-bastion/"
      $ready = $response.StatusCode -eq 200
    }
    catch {
      Start-Sleep -Milliseconds 100
    }
  }
  if (-not $ready) { throw "Last Bastion performance server did not become ready on port $testPort." }

  Push-Location $webRoot
  try {
    & $node 'scripts/measure-performance.mjs' @outputArguments
    if ($LASTEXITCODE -ne 0) { throw "Performance measurement failed with exit code $LASTEXITCODE." }
  }
  finally { Pop-Location }
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
    $server.WaitForExit()
  }
  $env:PLAYWRIGHT_BROWSERS_PATH = $previousBrowserRoot
  $env:LAST_BASTION_PERFORMANCE_URL = $previousPerformanceUrl
  $env:PORT = $previousPort
}
