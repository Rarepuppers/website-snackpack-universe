[CmdletBinding()]
param(
  [string]$FfmpegPath = "ffmpeg"
)

$ErrorActionPreference = "Stop"
$devRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$projectRoot = Resolve-Path (Join-Path $devRoot "..")
$runtime = Join-Path $devRoot "src/game/audio/runtime/batch-c3-tactician"
$expectedStems = @("tactician-damage", "tactician-death", "tactician-evade")

function Read-Metric([string]$Text, [string]$Pattern) {
  $matches = [regex]::Matches($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($matches.Count -eq 0) { return $null }
  return [double]::Parse($matches[$matches.Count - 1].Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture)
}

$results = foreach ($stem in $expectedStems) {
  foreach ($extension in @("ogg", "mp3")) {
    $file = Join-Path $runtime "$stem.$extension"
    if (-not (Test-Path -LiteralPath $file)) { throw "Missing derivative: $file" }
    $previousErrorPreference = $ErrorActionPreference
    try {
      $ErrorActionPreference = "Continue"
      $output = (& $FfmpegPath -hide_banner -nostats -i $file -filter_complex "ebur128=framelog=verbose:peak=true" -f null - 2>&1 | ForEach-Object { "$_" }) -join [Environment]::NewLine
      $exitCode = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $previousErrorPreference
    }
    if ($exitCode -ne 0) { throw "FFmpeg audit failed for $file" }
    $stream = [regex]::Match($output, "Audio:\s*([^,]+),\s*(\d+) Hz,\s*([^,]+)")
    $duration = [regex]::Match($output, "Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")
    $peak = Read-Metric $output "Peak:\s*([-+]?\d+(?:\.\d+)?)\s*dBFS"
    if (-not $stream.Success -or -not $duration.Success -or $null -eq $peak) {
      throw "Missing stream, duration, or true-peak metric for $file"
    }
    $durationSeconds = ([double]$duration.Groups[1].Value * 3600) + ([double]$duration.Groups[2].Value * 60) + [double]$duration.Groups[3].Value
    if ([int]$stream.Groups[2].Value -ne 48000) { throw "$file is not 48 kHz" }
    if ($stream.Groups[3].Value -notmatch "mono") { throw "$file is not mono" }
    if ($peak -gt -1.0) { throw "$file exceeds the -1.0 dBFS true-peak ceiling ($peak dBFS)" }
    if ($durationSeconds -lt 0.08 -or $durationSeconds -gt 1.5) { throw "$file has an unexpected duration ($durationSeconds seconds)" }
    $integratedLufs = Read-Metric $output "I:\s*([-+]?\d+(?:\.\d+)?)\s*LUFS"
    if ($integratedLufs -le -69.9) { $integratedLufs = $null }
    [pscustomobject]@{
      name = $stem
      format = $extension
      codec = $stream.Groups[1].Value.Trim()
      sampleRateHz = [int]$stream.Groups[2].Value
      channels = $stream.Groups[3].Value.Trim()
      durationSeconds = $durationSeconds
      integratedLufs = $integratedLufs
      truePeakDbfs = $peak
      bytes = (Get-Item -LiteralPath $file).Length
    }
  }
}

$reportPath = Join-Path $projectRoot "audio/production/batch-c3-tactician/c3-tactician-audio-audit.json"
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Output "C3 Tactician audio audit complete: $($results.Count) derivatives."
Write-Output "Wrote $reportPath"
Write-Output "Automated screening does not replace contextual human listening approval."
