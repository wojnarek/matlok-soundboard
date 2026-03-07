@echo off
setlocal
set ROOT=%~dp0..
set npm_config_cache=%ROOT%\.npm-cache
node "%~dp0generate-assets-manifest.mjs"
cd /d "%ROOT%"
npx --yes http-server . -p 8080 -c-1 -o /
