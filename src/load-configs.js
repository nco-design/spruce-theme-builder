const fs = require("fs");
const path = require("path");
const readJson = require("./read-json.js");
const { validateAssetOpacity } = require("./opacity.js");
const { ROOT_DIR, requireDirectory, resolveWithin } = require("./paths.js");

const SUPPORTED_ASSET_TYPES = new Set(["background", "button"]);

function validateAssetTypes(config, configPath) {
  for (const asset of config.icons) {
    validateAssetOpacity(asset, configPath);

    if (asset.type === undefined) {
      continue;
    }

    if (!SUPPORTED_ASSET_TYPES.has(asset.type)) {
      const assetName = asset["icon-name"] || asset.source || "asset sans nom";
      throw new Error(
        `Type d'asset invalide dans ${configPath} pour "${assetName}" : ` +
        `"${asset.type}". Valeurs acceptées : "background", "button"`
      );
    }
  }
}

function readFrontendConfigFile(configPath) {
  const config = readJson(configPath);

  if (!Array.isArray(config.icons)) {
    throw new Error(`Le fichier ${configPath} ne contient pas de tableau "icons"`);
  }

  validateAssetTypes(config, configPath);

  return config;
}

function readFrontendConfigs(frontendName, projectType, includeOptional = false) {
  const frontendsRoot = path.join(ROOT_DIR, "frontends");
  const frontendDir = resolveWithin(frontendsRoot, frontendName, projectType);
  const mainConfigName = `${projectType}.json`;
  const optionalConfigPattern = new RegExp(`^${projectType}-.+\\.json$`, "i");

  requireDirectory(
    frontendDir,
    `Configuration frontend introuvable : ${frontendDir}`
  );

  const configFiles = fs
    .readdirSync(frontendDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name === mainConfigName ||
          (includeOptional && optionalConfigPattern.test(entry.name)))
    )
    .map((entry) => entry.name)
    .sort((left, right) => {
      if (left === mainConfigName) return -1;
      if (right === mainConfigName) return 1;
      return left.localeCompare(right);
    });

  if (!configFiles.includes(mainConfigName)) {
    throw new Error(
      `Configuration frontend obligatoire absente : ${path.join(frontendDir, mainConfigName)}`
    );
  }

  return configFiles.map((fileName) => ({
    fileName,
    config: readFrontendConfigFile(path.join(frontendDir, fileName))
  }));
}

function readPalettes(palettesDir, themeFolder, paletteName) {
  const paletteFiles = fs
    .readdirSync(palettesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
    .map((entry) => entry.name)
    .sort();

  if (paletteFiles.length === 0) {
    throw new Error(`Aucune palette trouvée pour le thème "${themeFolder}"`);
  }

  const palettes = paletteFiles.map((fileName) => {
    const palette = readJson(path.join(palettesDir, fileName));

    if (!palette["palette-name"]) {
      throw new Error(`Champ manquant : "palette-name" dans ${fileName}`);
    }

    if (!palette.description) {
      throw new Error(`Champ manquant : "description" dans ${fileName}`);
    }

    return { fileName, palette };
  });

  if (!paletteName) {
    return palettes;
  }

  const selectedPalette = palettes.find(
    ({ palette }) => palette["palette-name"] === paletteName
  );

  if (!selectedPalette) {
    const availablePalettes = palettes
      .map(({ palette }) => palette["palette-name"])
      .join(", ");
    throw new Error(
      `Palette "${paletteName}" introuvable pour le thème "${themeFolder}". ` +
      `Palettes disponibles : ${availablePalettes}`
    );
  }

  return [selectedPalette];
}

function readStaticFilesConfig(frontendName) {
  const configPath = resolveWithin(
    path.join(ROOT_DIR, "frontends"),
    frontendName,
    "theme",
    "static-files.json"
  );
  const config = readJson(configPath);

  if (
    !Array.isArray(config.required) ||
    !Array.isArray(config.optional) ||
    (config["system-fonts"] && !Array.isArray(config["system-fonts"]))
  ) {
    throw new Error(
      `Configuration de fichiers statiques invalide : ${configPath}`
    );
  }

  return config;
}

function readFrontendSettings(frontendName) {
  const configPath = resolveWithin(
    path.join(ROOT_DIR, "frontends"),
    frontendName,
    "frontend.json"
  );
  const config = readJson(configPath);
  const resolutionConfig = config["resolution-config"];

  if (!resolutionConfig || typeof resolutionConfig.enabled !== "boolean") {
    throw new Error(
      `Switch "resolution-config.enabled" absent ou invalide : ${configPath}`
    );
  }

  if (resolutionConfig.enabled) {
    const requiredStrings = ["source-file", "manual-file", "output-file"];
    const invalidString = requiredStrings.some(
      (key) => typeof resolutionConfig[key] !== "string" || !resolutionConfig[key]
    );

    if (
      invalidString ||
      typeof resolutionConfig.scale !== "number" ||
      resolutionConfig.scale <= 0
    ) {
      throw new Error(`Configuration de résolution invalide : ${configPath}`);
    }
  }

  return config;
}

function loadBuildContext({
  themeFolder,
  frontendName,
  iconPackFolder,
  include720p = false,
  paletteName
}) {
  if (!themeFolder || !frontendName || !iconPackFolder) {
    throw new Error(
      "Usage : node build-theme <nom-du-theme> <frontend> <nom-du-pack-d-icones>"
    );
  }

  const themesRoot = path.join(ROOT_DIR, "projects", "themes");
  const iconPacksRoot = path.join(ROOT_DIR, "projects", "icon-packs");
  const themeDir = resolveWithin(themesRoot, themeFolder);
  const iconPackDir = resolveWithin(iconPacksRoot, iconPackFolder);
  const themeAssetsDir = path.join(themeDir, "assets");
  const palettesDir = path.join(themeDir, "palettes");
  const iconPackAssetsDir = path.join(iconPackDir, "assets");
  const placeholderDir = resolveWithin(
    path.join(ROOT_DIR, "frontends", frontendName),
    "placeholder-static-files"
  );

  requireDirectory(themeDir, `Le thème "${themeFolder}" n'existe pas`);
  requireDirectory(themeAssetsDir, `Le dossier assets du thème "${themeFolder}" n'existe pas`);
  requireDirectory(palettesDir, `Le dossier palettes du thème "${themeFolder}" n'existe pas`);
  requireDirectory(iconPackDir, `Le pack d'icônes "${iconPackFolder}" n'existe pas`);
  requireDirectory(
    iconPackAssetsDir,
    `Le dossier assets du pack d'icônes "${iconPackFolder}" n'existe pas`
  );
  requireDirectory(
    placeholderDir,
    `Le dossier de placeholders du frontend "${frontendName}" n'existe pas`
  );

  const themeConfig = readJson(path.join(themeDir, "config.json"));
  const iconPackConfig = readJson(path.join(iconPackDir, "config.json"));
  const themeSourcePalette = readJson(path.join(themeDir, "source-palette.json"));
  const iconPackSourcePalette = readJson(
    path.join(iconPackDir, "source-palette.json")
  );

  if (!themeConfig["theme-name"]) {
    throw new Error('Champ manquant : "theme-name" dans le config.json du thème');
  }

  if (!themeConfig.description || !themeConfig.Author) {
    throw new Error(
      'Champs "description" ou "Author" manquants dans le config.json du thème'
    );
  }

  if (!iconPackConfig["pack-name"]) {
    throw new Error('Champ manquant : "pack-name" dans le config.json du pack d\'icônes');
  }

  if (!iconPackConfig.description || !iconPackConfig.Author) {
    throw new Error(
      'Champs "description" ou "Author" manquants dans le config.json du pack d\'icônes'
    );
  }

  return {
    frontendName,
    frontendSettings: readFrontendSettings(frontendName),
    iconPackAssetsDir,
    iconPackConfig,
    iconPackFolder,
    iconPackFrontends: readFrontendConfigs(frontendName, "icon-pack", include720p),
    iconPackSourcePalette,
    include720p,
    palettes: readPalettes(palettesDir, themeFolder, paletteName),
    placeholderDir,
    staticFiles: readStaticFilesConfig(frontendName),
    themeAssetsDir,
    themeConfig,
    themeFolder,
    themeFrontends: readFrontendConfigs(frontendName, "theme", include720p),
    themeSourcePalette
  };
}

module.exports = { loadBuildContext, readFrontendConfigs, validateAssetTypes };
