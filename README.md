# Soundboard (Rust + WebAssembly)

Aplikacja soundboard z interfejsem renderowanym i obslugiwanym przez Rust/WASM.
Przyciski sa generowane dynamicznie na podstawie plikow audio w `assets/`.

## Architektura

- `src/lib.rs` - logika aplikacji (fetch manifestu, render kafelkow, odtwarzanie audio)
- `scripts/generate-assets-manifest.mjs` - generuje `www/assets-manifest.json` z folderu `assets/`
- `www/index.html` - minimalny bootstrap WASM
- `www/style.css` - wyglad kafelkow
- `scripts/build.cmd` / `scripts/build.ps1` - build manifest + WASM
- `scripts/serve.cmd` / `scripts/serve.ps1` - lokalny serwer na porcie `8080`

## Wymagania

1. Rust + rustup
2. Target WASM:
   - `rustup target add wasm32-unknown-unknown`
3. wasm-pack:
   - `cargo install wasm-pack`
4. Node.js

## Build

```bat
scripts\build.cmd
```

## Start

```bat
scripts\serve.cmd
```

Aplikacja otwiera sie pod:

- http://localhost:8080/www/index.html

## Assets

- Dzwieki: pliki `.mp3/.wav/.ogg/.m4a/.flac/.aac` w `assets/`
- Tlo kafelka: `assets/etykieta.png`
- Nazwa na kafelku pochodzi z nazwy pliku audio (bez rozszerzenia; `_`/`-` zamieniane na spacje)
