param(
  [Parameter(Mandatory = $true)][string]$SteamCmdPath,
  [Parameter(Mandatory = $true)][string]$AccountName
)

$ErrorActionPreference = "Stop"
$desktopRoot = Split-Path -Parent $PSScriptRoot
$appBuild = Join-Path $desktopRoot "steampipe\work\scripts\app_build.vdf"
$resolvedSteamCmd = (Resolve-Path -LiteralPath $SteamCmdPath).Path
if (-not (Test-Path -LiteralPath $appBuild -PathType Leaf)) {
  throw "Run prepare-steampipe.ps1 before upload."
}

# Deliberately omit the password: SteamCMD prompts for credentials and Steam Guard
# without placing either secret in command history or the process command line.
& $resolvedSteamCmd +login $AccountName +run_app_build $appBuild +quit
if ($LASTEXITCODE -ne 0) { throw "SteamPipe upload failed." }
