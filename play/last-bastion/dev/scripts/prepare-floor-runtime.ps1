$ErrorActionPreference = "Stop"
$art = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../../art/production-tests"))
$jobs = @(
  @("bastion-floor-pilot/bastion-floor-pilot-a-source.png", "bastion-floor-pilot/floor-pilot-a-runtime.png", "512x512!"),
  @("bastion-floor-pilot/bastion-floor-pilot-b-source.png", "bastion-floor-pilot/floor-pilot-b-runtime.png", "512x512!"),
  @("bastion-floor-pilot/bastion-scuff-pilot-source.png", "bastion-floor-pilot/scuff-pilot-runtime.png", "256x256!"),
  @("bastion-floor-kit/floor-kit-source.png", "bastion-floor-kit/floor-kit-runtime.png", "1024x512!"),
  @("bastion-floor-kit/decal-kit-source.png", "bastion-floor-kit/decal-kit-runtime.png", "512x512!")
)
foreach ($job in $jobs) {
  & magick (Join-Path $art $job[0]) -filter box -resize $job[2] -strip (Join-Path $art $job[1])
  if ($LASTEXITCODE -ne 0) { throw "Floor derivative failed: $($job[0])" }
}
