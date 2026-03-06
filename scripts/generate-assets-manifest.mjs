import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const assetsDir = path.join(projectRoot, "assets");
const outputPath = path.join(projectRoot, "www", "assets-manifest.json");

const audioExtensions = new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"]);

function labelFromFilename(filename) {
  const noExt = filename.replace(/\.[^.]+$/, "");
  return noExt.replace(/[_-]+/g, " ").trim();
}

async function generateManifest() {
  const entries = await fs.readdir(assetsDir, { withFileTypes: true });

  const sounds = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => audioExtensions.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "pl"))
    .map((file) => ({
      name: labelFromFilename(file),
      file: `../assets/${file}`,
    }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    sounds,
  };

  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Generated ${sounds.length} sounds in ${outputPath}`);
}

generateManifest().catch((error) => {
  console.error("Failed to generate assets manifest:", error);
  process.exit(1);
});
