param(
  [Parameter(Mandatory = $true)][string]$Executable
)

$ErrorActionPreference = "Stop"
$executablePath = (Resolve-Path -LiteralPath $Executable).Path
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $executablePath
$startInfo.Arguments = "--smoke-test --disable-gpu"
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$hostProcess = New-Object System.Diagnostics.Process
$hostProcess.StartInfo = $startInfo
$previousSmokeMode = $env:LAST_BASTION_PACKAGED_SMOKE
$env:LAST_BASTION_PACKAGED_SMOKE = "1"
if (-not $hostProcess.Start()) { throw "Packaged host did not start." }

try {
  $completed = $hostProcess.WaitForExit(15000)
  if (-not $completed) {
    Stop-Process -Id $hostProcess.Id -Force -ErrorAction SilentlyContinue
    $hostProcess.WaitForExit(5000) | Out-Null
  }
  $stdout = $hostProcess.StandardOutput.ReadToEnd()
  $stderr = $hostProcess.StandardError.ReadToEnd()
  if (-not $completed) { throw "Packaged smoke test timed out. $stdout $stderr" }
  if ($hostProcess.ExitCode -ne 0) {
    if ($hostProcess.ExitCode -eq -1073741819) {
      throw "Packaged Electron crashed before renderer acceptance (Windows 0xC0000005 access violation). Run the same package from an ordinary local PowerShell session; if it still fails, capture Electron startup logging before changing game code."
    }
    throw "Packaged smoke test exited $($hostProcess.ExitCode). $stderr"
  }
  if ($stdout -notmatch "PASS packaged renderer:") {
    throw "Packaged smoke test did not report renderer acceptance. $stdout $stderr"
  }
  Write-Output $stdout.Trim()
}
finally {
  $env:LAST_BASTION_PACKAGED_SMOKE = $previousSmokeMode
  if (-not $hostProcess.HasExited) {
    Stop-Process -Id $hostProcess.Id -Force -ErrorAction SilentlyContinue
    $hostProcess.WaitForExit(5000) | Out-Null
  }
}
