param()

$ErrorActionPreference = 'Stop'

$gameRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$siteRoot = Resolve-Path (Join-Path $gameRoot '..\..')
$iconSource = Join-Path $gameRoot 'desktop\packaging-assets\icon-source.png'
$arcadeTile = Join-Path $siteRoot 'play\tiles\last-bastion.png'
$combatCapture = Join-Path $siteRoot 'guides\free-browser-roguelite\assets\combat-mid-wave.png'
$socialPng = Join-Path $siteRoot 'play\social\last-bastion.png'
$socialWebp = Join-Path $siteRoot 'play\social\last-bastion.webp'

if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
  throw 'ImageMagick (magick) is required to build Last Bastion marketing derivatives.'
}

& magick $iconSource -resize '144x144!' -strip $arcadeTile
if ($LASTEXITCODE -ne 0) { throw "ImageMagick failed while writing $arcadeTile" }

if (-not (Test-Path -LiteralPath $combatCapture)) {
  throw "Capture the guide assets before composing the social card: $combatCapture"
}

$cardBase = Join-Path ([System.IO.Path]::GetTempPath()) 'last-bastion-social-base.png'
$cardIcon = Join-Path ([System.IO.Path]::GetTempPath()) 'last-bastion-social-icon.png'
try {
  & magick $combatCapture -resize '1200x675^' -gravity center -extent '1200x630' -fill '#07101c' -colorize '48%' $cardBase
  if ($LASTEXITCODE -ne 0) { throw 'ImageMagick failed while preparing the social-card background.' }
  & magick $iconSource -resize '340x340!' $cardIcon
  if ($LASTEXITCODE -ne 0) { throw 'ImageMagick failed while preparing the social-card icon.' }
  & magick $cardBase $cardIcon -gravity west -geometry '+48+0' -composite `
    -font Consolas -fill '#e8e2d4' -pointsize 82 -gravity northwest -annotate '+430+205' 'LAST BASTION' `
    -fill '#68e4e8' -pointsize 34 -annotate '+435+305' 'HOLD THE LINE' `
    -fill '#d7dde8' -pointsize 26 -annotate '+435+375' 'FREE BROWSER ROGUELITE' `
    -strip $socialPng
  if ($LASTEXITCODE -ne 0) { throw "ImageMagick failed while writing $socialPng" }
  & magick $socialPng -quality 88 $socialWebp
  if ($LASTEXITCODE -ne 0) { throw "ImageMagick failed while writing $socialWebp" }
}
finally {
  Remove-Item -LiteralPath $cardBase,$cardIcon -Force -ErrorAction SilentlyContinue
}

Write-Host "Wrote play/tiles/last-bastion.png"
Write-Host "Wrote play/social/last-bastion.png and .webp"
