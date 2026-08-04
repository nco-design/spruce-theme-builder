const fs = require("fs");
const path = require("path");
const readJson = require("./read-json.js");
const { resolveWithin } = require("./paths.js");

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function collectFontReferences(value, references = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectFontReferences(item, references);
    }
    return references;
  }

  if (!value || typeof value !== "object") {
    return references;
  }

  for (const [key, item] of Object.entries(value)) {
    if (key === "font" && typeof item === "string" && item) {
      references.add(item);
    }
    collectFontReferences(item, references);
  }

  return references;
}

function validateStaticFiles({ outputDir, staticFiles }) {
  const configPath = resolveWithin(outputDir, "config.json");
  const config = readJson(configPath);
  const systemFonts = new Set(staticFiles["system-fonts"] || []);
  const fontReferences = collectFontReferences(config);
  let validatedFonts = 0;
  let validatedSounds = 0;

  for (const font of fontReferences) {
    if (systemFonts.has(font)) {
      continue;
    }

    const fontPath = resolveWithin(outputDir, font);
    if (!isFile(fontPath)) {
      throw new Error(`Police référencée par config.json introuvable : ${font}`);
    }
    validatedFonts++;
  }

  for (const relativePath of staticFiles.required.filter(
    (filePath) => filePath.startsWith("sound/")
  )) {
    const soundPath = resolveWithin(outputDir, relativePath);
    if (!isFile(soundPath)) {
      throw new Error(`Fichier audio obligatoire introuvable : ${relativePath}`);
    }
    validatedSounds++;
  }

  return { validatedFonts, validatedSounds };
}

module.exports = { collectFontReferences, validateStaticFiles };
