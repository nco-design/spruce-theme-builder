const fs = require("fs");
const path = require("path");
const readJson = require("./read-json.js");
const { resolveWithin } = require("./paths.js");

const FORBIDDEN_PATH_PARTS = new Set(["__proto__", "constructor", "prototype"]);

function getPaletteBindings(themeConfig, frontendName) {
  const frontendConfig = themeConfig["frontend-configs"]?.[frontendName];
  const bindings = frontendConfig?.["palette-bindings"];

  if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
    throw new Error(
      `Table "frontend-configs.${frontendName}.palette-bindings" absente ou invalide`
    );
  }

  return bindings;
}

function setConfigPath(config, configPath, value) {
  const parts = configPath.split(".");

  if (parts.some((part) => !part || FORBIDDEN_PATH_PARTS.has(part))) {
    throw new Error(`Chemin de configuration invalide : ${configPath}`);
  }

  let current = config;

  for (const part of parts.slice(0, -1)) {
    if (!Object.hasOwn(current, part) || typeof current[part] !== "object") {
      throw new Error(`Chemin parent introuvable dans config.json : ${configPath}`);
    }
    current = current[part];
  }

  current[parts.at(-1)] = value;
}

function injectPaletteIntoConfig({
  configFileName = "config.json",
  frontendName,
  outputDir,
  palette,
  themeConfig
}) {
  const outputConfigPath = resolveWithin(outputDir, configFileName);
  const outputConfig = readJson(outputConfigPath);
  const bindings = getPaletteBindings(themeConfig, frontendName);

  for (const [configPath, paletteProperty] of Object.entries(bindings)) {
    const value = palette.properties?.[paletteProperty];

    if (!value) {
      throw new Error(
        `Couleur "${paletteProperty}" introuvable pour le chemin "${configPath}"`
      );
    }

    setConfigPath(outputConfig, configPath, value);
  }

  fs.writeFileSync(outputConfigPath, `${JSON.stringify(outputConfig, null, 4)}\n`);

  return Object.keys(bindings).length;
}

module.exports = { injectPaletteIntoConfig };
