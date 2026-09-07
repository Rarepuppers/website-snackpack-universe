$ErrorActionPreference = 'Stop'

$siteRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$gameRoot = Join-Path $siteRoot 'play\last-bastion'
$webRoot = Join-Path $gameRoot 'dev'
$desktopRoot = Join-Path $gameRoot 'desktop'

function Invoke-VerificationLane {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  Write-Host "`n=== $Name ==="
  Push-Location $WorkingDirectory
  try {
    & npm.cmd @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
    $timer.Stop()
  }
  Write-Host ("PASS {0} ({1:n1}s)" -f $Name, $timer.Elapsed.TotalSeconds)
}

Push-Location $siteRoot
try {
  $commit = (& git rev-parse --short HEAD).Trim()
  $dirty = [bool](& git status --short -- play/last-bastion package.json playwright.last-bastion.config.mjs scripts)
}
finally {
  Pop-Location
}

Write-Host "Last Bastion verification"
Write-Host "Commit: $commit"
Write-Host "Working tree: $(if ($dirty) { 'DIRTY' } else { 'clean' })"

$total = [System.Diagnostics.Stopwatch]::StartNew()
Invoke-VerificationLane -Name 'Web static/unit/build/smoke/offline' -WorkingDirectory $webRoot -Arguments @('run', 'verify')
Invoke-VerificationLane -Name 'Executable browser acceptance' -WorkingDirectory $siteRoot -Arguments @('run', 'test:last-bastion')
Invoke-VerificationLane -Name 'Desktop host build and tests' -WorkingDirectory $desktopRoot -Arguments @('test')
$total.Stop()

Write-Host "`nALL REQUIRED LANES PASSED ($([math]::Round($total.Elapsed.TotalSeconds, 1))s)"
Write-Host 'Manual gates still required: observed gameplay/visual/audio review, packaged-window hardware checks, and Steam client acceptance.'
