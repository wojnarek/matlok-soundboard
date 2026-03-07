const padsEl = document.getElementById("pads");
const volumeEl = document.getElementById("volume");
const volumeValueEl = document.getElementById("volumeValue");
const volumeBeerEl = document.getElementById("volumeBeer");

let volumePercent = 100;
let audioCtx;
let masterGain;
let distortion;

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
  bg.src = "/assets/etykieta.png";
  bg.alt = "";
  bg.loading = "eager";
  bg.decoding = "async";
  btn.appendChild(bg);

  const label = document.createElement("span");
  label.className = "pad-label";
  label.textContent = item.name;
  btn.appendChild(label);

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

  const sounds = await loadSounds();

  padsEl.innerHTML = "";
  sounds.forEach((item) => {
    padsEl.appendChild(createPad(item));
  });
}

main().catch((error) => {
  console.error(error);
});
