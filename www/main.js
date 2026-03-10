const padsEl = document.getElementById("pads");
const volumeEl = document.getElementById("volume");
const volumeValueEl = document.getElementById("volumeValue");
const volumeBeerEl = document.getElementById("volumeBeer");

let volumePercent = 100;
let audioCtx;
let masterGain;
let distortion;
let labelImageDataUrl = null;

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapLabel(text) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = "";
  const maxLength = 14;

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength || current.length === 0) {
      current = candidate;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  if (lines.length > 3) {
    return [...lines.slice(0, 2), lines.slice(2).join(" ")];
  }

  return lines;
}

function createPadSvg(label) {
  const lines = wrapLabel(label).map(escapeXml);
  const centerX = 230.5;
  const centerY = 318;
  const fontSize = lines.length >= 3 ? 31 : label.length > 18 ? 34 : 38;
  const lineHeight = fontSize * 1.05;
  const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${centerX}" y="${(startY + index * lineHeight).toFixed(1)}">${line}</tspan>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 461 542" width="461" height="542">
    <image href="${labelImageDataUrl}" width="461" height="542" preserveAspectRatio="xMidYMid meet" />
    <text
      x="${centerX}"
      y="${centerY}"
      fill="#0f4d2d"
      font-family="Randolph, Impact, 'Arial Black', sans-serif"
      font-size="${fontSize}"
      font-weight="700"
      text-anchor="middle"
      transform="rotate(-13 ${centerX} ${centerY})"
    >${tspans}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function loadLabelImage() {
  const response = await fetch("/assets/etykieta.png", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Nie mozna wczytac etykiety: ${response.status}`);
  }

  const blob = await response.blob();
  labelImageDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Nie mozna odczytac etykiety"));
    reader.readAsDataURL(blob);
  });
}

function distortionCurve(amount) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = Math.max(0, amount);
  const deg = Math.PI / 180;

  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }

  return curve;
}

function paintSlider() {
  const min = Number(volumeEl.min || 0);
  const max = Number(volumeEl.max || 100);
  const pct = ((volumePercent - min) * 100) / Math.max(1, max - min);
  volumeEl.style.setProperty("--fill", `${pct}%`);
  if (volumeBeerEl) {
    volumeBeerEl.style.left = `calc(${pct}% - 14px)`;
  }
}

function ensureAudioChain() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    distortion = audioCtx.createWaveShaper();
    distortion.oversample = "4x";

    masterGain.connect(distortion);
    distortion.connect(audioCtx.destination);
  }

  const gain = Math.max(0, volumePercent / 100);
  masterGain.gain.value = gain;

  const overdrive = Math.max(0, volumePercent - 100) * 4;
  distortion.curve = distortionCurve(overdrive);
}

function updateVolumeLabel() {
  volumeValueEl.textContent = String(volumePercent);
  paintSlider();
}

async function loadSounds() {
  const response = await fetch("/www/assets-manifest.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Nie mozna wczytac manifestu: ${response.status}`);
  }

  const manifest = await response.json();
  const sounds = Array.isArray(manifest.sounds) ? manifest.sounds : [];

  if (sounds.length === 0) {
    throw new Error("Brak plikow audio w folderze assets");
  }

  return sounds;
}

function createPad(item) {
  const btn = document.createElement("button");
  btn.className = "pad";
  btn.type = "button";

  const bg = document.createElement("img");
  bg.className = "pad-bg";
  bg.src = createPadSvg(item.name);
  bg.alt = item.name;
  bg.loading = "eager";
  bg.decoding = "async";
  btn.appendChild(bg);

  btn.addEventListener("click", async () => {
    ensureAudioChain();

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const audio = new Audio(item.file);
    audio.preload = "auto";
    audio.volume = 1;
    audio.currentTime = 0;

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(masterGain);

    audio.addEventListener("ended", () => {
      try {
        source.disconnect();
      } catch {
        // ignore disconnect race
      }
    });

    try {
      await audio.play();
    } catch {
      try {
        source.disconnect();
      } catch {
        // ignore disconnect race
      }
    }
  });

  return btn;
}

async function main() {
  volumePercent = Number(volumeEl.value);
  updateVolumeLabel();

  volumeEl.addEventListener("input", (event) => {
    volumePercent = Number(event.target.value);
    updateVolumeLabel();
    if (audioCtx) {
      ensureAudioChain();
    }
  });

  await loadLabelImage();
  const sounds = await loadSounds();

  padsEl.innerHTML = "";
  sounds.forEach((item) => {
    padsEl.appendChild(createPad(item));
  });
}

main().catch((error) => {
  console.error(error);
});
