# Soundboard (JS-only, ready for wykr.es)

Lekka wersja soundboardu w czystym JavaScript (bez WASM), kompatybilna z proxy wykr.es.
Wyglad i funkcjonalnosc zostaly zachowane.

## Struktura

- `www/index.html` - glowny widok aplikacji
- `www/main.js` - logika UI i odtwarzania dzwiekow
- `www/style.css` - style kafelkow
- `www/assets-manifest.json` - lista plikow audio generowana automatycznie
- `assets/` - pliki audio + `etykieta.png`
- `scripts/generate-assets-manifest.mjs` - generator manifestu
- `scripts/build.cmd` / `scripts/build.ps1` - odswiezenie manifestu
- `scripts/serve.cmd` / `scripts/serve.ps1` - lokalny serwer testowy

## Wymagania

- Node.js

## Praca lokalna

1. Odswiez manifest audio:

```bat
scripts\build.cmd
```

2. Uruchom lokalnie:

```bat
scripts\serve.cmd
```

3. Otworz:

- http://localhost:8080/www/index.html

## Jak dodawac nowe dzwieki

1. Wrzuc pliki audio do `assets/`
2. Uruchom `scripts\build.cmd`
3. Commituj zmiany (w tym `www/assets-manifest.json`)

## Deploy przez Git (prosto pod VPS)

Na serwerze po `git pull` nie musisz budowac WASM.
Wystarczy miec aktualne pliki z repo i zrestartowac nginx.

Przy aktualizacji dzwiekow zawsze commituj:

- nowe pliki z `assets/`
- `www/assets-manifest.json`
