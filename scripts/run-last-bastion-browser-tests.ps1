$ErrorActionPreference = 'Stop'

$siteRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$browserRoot = Join-Path $siteRoot '.playwright-browsers'
$playwright = Join-Path $siteRoot 'node_modules\.bin\playwright.cmd'
$testPort = 44175

if (-not (Test-Path -LiteralPath $browserRoot)) {
  throw "Repository Playwright browsers are missing: $browserRoot"
}
if (-not (Test-Path -LiteralPath $playwright)) {
  throw "Playwright is not installed in the website workspace: $playwright"
}

$previousBrowserRoot = $env:PLAYWRIGHT_BROWSERS_PATH
$previousTestPort = $env:LAST_BASTION_TEST_PORT
$previousPort = $env:PORT
$server = $null
try {
  $env:PLAYWRIGHT_BROWSERS_PATH = $browserRoot
  $env:LAST_BASTION_TEST_PORT = [string]$testPort
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
  if (-not $ready) {
    throw "Last Bastion test server did not become ready on port $testPort."
  }
  Push-Location $siteRoot
  try {
    & $playwright test tests/visual/last-bastion-functional.spec.mjs `
      --config playwright.last-bastion.config.mjs
    if ($LASTEXITCODE -ne 0) {
      throw "Last Bastion browser acceptance failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
    $server.WaitForExit()
  }
  $env:PLAYWRIGHT_BROWSERS_PATH = $previousBrowserRoot
  $env:LAST_BASTION_TEST_PORT = $previousTestPort
  $env:PORT = $previousPort
}
