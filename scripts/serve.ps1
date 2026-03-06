# Serve static frontend on port 8080 with local npm cache
$root = Join-Path $PSScriptRoot ".."
$env:PATH = "$env:USERPROFILE\\.cargo\\bin;" + $env:PATH
$env:npm_config_cache = Join-Path $root ".npm-cache"
node "$PSScriptRoot/generate-assets-manifest.mjs"
Set-Location $root
npx --yes http-server . -p 8080 -c-1 -o /www/index.html
