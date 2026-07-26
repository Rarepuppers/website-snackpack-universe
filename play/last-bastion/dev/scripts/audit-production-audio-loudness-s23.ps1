[CmdletBinding()]
param(
  [string]$FfmpegPath = ""
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$repoRoot = Split-Path -Parent $projectRoot

if (-not $FfmpegPath) {
  $command = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($command) {
    $FfmpegPath = $command.Source
  }
}

if (-not $FfmpegPath -or -not (Test-Path -LiteralPath $FfmpegPath)) {
  throw "FFmpeg was not found. Add it to PATH or rerun with -FfmpegPath C:\\path\\to\\ffmpeg.exe."
}

$runtimeRoot = Join-Path $projectRoot "src\\game\\audio\\runtime"
$files = @(
  Get-ChildItem (Join-Path $runtimeRoot "batch-s2") -File | Where-Object { $_.Extension -in ".ogg", ".mp3" }
  Get-ChildItem (Join-Path $runtimeRoot "batch-s3") -File | Where-Object { $_.Extension -in ".ogg", ".mp3" }
)

function Read-Metric([string]$Text, [string]$Pattern) {
  $match = [regex]::Match($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if (-not $match.Success) { return $null }
  return [double]::Parse($match.Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture)
}

function Has-Metric([string]$Text, [string]$Pattern) {
  return [regex]::IsMatch($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

$results = foreach ($file in $files | Sort-Object FullName) {
  $stdoutPath = [IO.Path]::GetTempFileName()
  $stderrPath = [IO.Path]::GetTempFileName()
  try {
    $argumentList = @(
      "-hide_banner"
      "-nostats"
      "-i"
      ('"' + $file.FullName + '"')
      "-filter_complex"
      '"ebur128=framelog=verbose"'
      "-f"
      "null"
      "NUL"
    )
    $process = Start-Process -FilePath $FfmpegPath -ArgumentList $argumentList -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -NoNewWindow -Wait -PassThru
    $exitCode = $process.ExitCode
    $output = (Get-Content -LiteralPath $stdoutPath -Raw) + (Get-Content -LiteralPath $stderrPath -Raw)
  } finally {
    Remove-Item -LiteralPath $stdoutPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stderrPath -Force -ErrorAction SilentlyContinue
  }
  if ($exitCode -ne 0) { throw "FFmpeg failed for $($file.Name)." }
  [pscustomobject]@{
    batch = Split-Path (Split-Path $file.FullName -Parent) -Leaf
    name = $file.BaseName
    format = $file.Extension.TrimStart(".")
    integratedLufs = Read-Metric $output "(?m)^\s*I:\s*([-+]?\d+(?:\.\d+)?)\s*LUFS"
    integratedLufsReported = Has-Metric $output "(?m)^\s*I:\s*(?:[-+]?\d+(?:\.\d+)?|-inf)\s*LUFS"
    loudnessRangeLu = Read-Metric $output "(?m)^\s*LRA:\s*([-+]?\d+(?:\.\d+)?)\s*LU"
    truePeakDbfs = Read-Metric $output "(?m)^\s*Peak:\s*([-+]?\d+(?:\.\d+)?)\s*dBFS"
    truePeakReported = Has-Metric $output "(?m)^\s*Peak:\s*[-+]?\d+(?:\.\d+)?\s*dBFS"
  }
}

$reportPath = Join-Path (Join-Path $repoRoot "audio") (Join-Path "production" "s23-loudness-audit.json")
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $reportPath -Encoding utf8

$missing = @($results | Where-Object { -not $_.integratedLufsReported -or -not $_.truePeakReported })
if ($missing.Count -gt 0) { throw "Missing EBU R128 metrics for $($missing.Count) derivatives." }

Write-Output "S2/S3 loudness audit complete: $($results.Count) derivatives."
Write-Output "Wrote $reportPath"
Write-Output "Note: use the report for screening; final mix approval still requires contextual in-game listening."
