@echo off
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
node "%~dp0generate-assets-manifest.mjs"
wasm-pack build --target web --out-dir .\www\pkg
