# Last Bastion verification: every automated lane, one exit code, one report.
#
# QA-07. The remaining piece was machine-readable output: the script printed
# durations for a human and nothing a script could read, so "did the branch
# verify?" could only be answered by eye.
#
#   -Json <path>   also write the report as JSON
#
# Two rules this encodes, both from the audit's acceptance criteria:
#
#   * A required lane that did not PASS fails the run — including one that never
#     ran, because "not run" and "passed" must never look alike in a report.
#   * Manual gates are listed explicitly as MANUAL rather than omitted. A report
#     that silently drops the hardware and observed-play gates reads as though
#     the release is fully verified, which is the misleading half of QA-07.
#
# Lanes stop at the first failure on purpose: every later lane would be
# exercising a build already known to be broken, so their results would be
# noise. They are recorded as NOT-RUN rather than quietly missing.
param(
  [string]$Json
)

$ErrorActionPreference = 'Stop'

$siteRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$gameRoot = Join-Path $siteRoot 'play\last-bastion'
$webRoot = Join-Path $gameRoot 'dev'
$desktopRoot = Join-Path $gameRoot 'desktop'

$lanes = @(
  @{ Name = 'web';     Title = 'Web static/unit/build/smoke/offline'; Dir = $webRoot;     Args = @('run', 'verify') }
  @{ Name = 'browser'; Title = 'Executable browser acceptance';       Dir = $siteRoot;    Args = @('run', 'test:last-bastion') }
  @{ Name = 'desktop'; Title = 'Desktop host build and tests';        Dir = $desktopRoot; Args = @('test') }
)

# Not lanes. Recorded so a reader can see what automation does not cover.
$manualGates = @(
  'Observed gameplay, visual and audio review',
  'Packaged-window hardware checks',
  'Steam client acceptance'
)

Push-Location $siteRoot
try {
  $commit = (& git rev-parse --short HEAD).Trim()
  $dirty = [bool](& git status --short -- play/last-bastion package.json playwright.last-bastion.config.mjs scripts)
}
finally {
  Pop-Location
}

# The identity a seed reproduces against; see dev/src/game/run/BuildIdentity.ts.
$buildIdentity = 'unknown'
$identityFile = Join-Path $webRoot 'src\game\run\BuildIdentity.ts'
if (Test-Path -LiteralPath $identityFile) {
  $match = Select-String -LiteralPath $identityFile -Pattern 'BUILD_IDENTITY\s*=\s*"([^"]+)"'
  if ($match) { $buildIdentity = $match.Matches[0].Groups[1].Value }
}

Write-Host "Last Bastion verification"
Write-Host "Commit: $commit"
Write-Host "Build identity: $buildIdentity"
Write-Host "Working tree: $(if ($dirty) { 'DIRTY' } else { 'clean' })"

$results = @()
$failed = $false
$total = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($lane in $lanes) {
  if ($failed) {
    Write-Host ("NOT-RUN {0} (a previous lane failed)" -f $lane.Title)
    $results += [pscustomobject]@{ lane = $lane.Name; title = $lane.Title; status = 'NOT-RUN'; seconds = 0 }
    continue
  }
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  Write-Host "`n=== $($lane.Title) ==="
  Push-Location $lane.Dir
  try {
    & npm.cmd @($lane.Args)
    $code = $LASTEXITCODE
  }
  finally {
    Pop-Location
    $timer.Stop()
  }
  $status = if ($code -eq 0) { 'PASS' } else { 'FAIL' }
  if ($code -ne 0) { $failed = $true }
  Write-Host ("{0} {1} ({2:n1}s)" -f $status, $lane.Title, $timer.Elapsed.TotalSeconds)
  $results += [pscustomobject]@{
    lane = $lane.Name
    title = $lane.Title
    status = $status
    seconds = [math]::Round($timer.Elapsed.TotalSeconds, 1)
  }
}
$total.Stop()

$report = [pscustomobject]@{
  commit = $commit
  buildIdentity = $buildIdentity
  workingTree = $(if ($dirty) { 'dirty' } else { 'clean' })
  finishedAt = (Get-Date).ToString('o')
  totalSeconds = [math]::Round($total.Elapsed.TotalSeconds, 1)
  result = $(if ($failed) { 'FAIL' } else { 'PASS' })
  lanes = $results
  manualGates = $manualGates
}

if ($Json) {
  $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Json -Encoding utf8
  Write-Host "`nReport written to $Json"
}

Write-Host ""
foreach ($entry in $results) {
  Write-Host ("{0,-8} {1}" -f $entry.status, $entry.title)
}
Write-Host ""
Write-Host 'Manual gates, not covered by anything above:'
foreach ($gate in $manualGates) { Write-Host "  MANUAL   $gate" }

if ($failed) {
  Write-Host ("`nVERIFICATION FAILED ({0}s)" -f [math]::Round($total.Elapsed.TotalSeconds, 1))
  exit 1
}

Write-Host ("`nALL REQUIRED LANES PASSED ({0}s)" -f [math]::Round($total.Elapsed.TotalSeconds, 1))
