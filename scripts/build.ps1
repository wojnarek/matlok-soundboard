# Build WASM package into project www/pkg
$env:PATH = "$env:USERPROFILE\\.cargo\\bin;" + $env:PATH
node "$PSScriptRoot/generate-assets-manifest.mjs"
wasm-pack build --target web --out-dir ./www/pkg
