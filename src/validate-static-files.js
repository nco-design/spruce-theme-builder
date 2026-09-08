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

function validateStaticFiles({ outputDir, systemFonts = [] }) {
  const configPath = resolveWithin(outputDir, "config.json");
  const config = readJson(configPath);
  const systemFontNames = new Set(systemFonts);
  const fontReferences = collectFontReferences(config);
  let validatedFonts = 0;
  let validatedSounds = 0;

  for (const font of fontReferences) {
    if (systemFontNames.has(font)) {
      continue;
    }

    const fontPath = resolveWithin(outputDir, font);
    if (!isFile(fontPath)) {
      throw new Error(`Font referenced by config.json not found: ${font}`);
    }
    validatedFonts++;
  }

  const soundDir = resolveWithin(outputDir, "sound");
  if (fs.existsSync(soundDir) && fs.statSync(soundDir).isDirectory()) {
    validatedSounds = fs.readdirSync(soundDir, { withFileTypes: true })
      .filter((entry) => entry.isFile()).length;
  }

  return { validatedFonts, validatedSounds };
}

module.exports = { collectFontReferences, validateStaticFiles };
