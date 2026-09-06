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
      const assetName = asset["icon-name"] || asset.source || "unnamed asset";
      throw new Error(
        `Invalid asset type in ${configPath} for "${assetName}": ` +
        `"${asset.type}". Accepted values: "background", "button"`
      );
    }
  }
}

function readFrontendConfigFile(configPath) {
  const config = readJson(configPath);

  if (!Array.isArray(config.icons)) {
    throw new Error(`File ${configPath} does not contain an "icons" array`);
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
    `Frontend configuration not found: ${frontendDir}`
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
      `Required frontend configuration is missing: ${path.join(frontendDir, mainConfigName)}`
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
    throw new Error(`No palette found for theme "${themeFolder}"`);
  }

  const palettes = paletteFiles.map((fileName) => {
    const palette = readJson(path.join(palettesDir, fileName));

    if (!palette["palette-name"]) {
      throw new Error(`Missing field "palette-name" in ${fileName}`);
    }

    if (!palette.description) {
      throw new Error(`Missing field "description" in ${fileName}`);
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
      `Palette "${paletteName}" not found for theme "${themeFolder}". ` +
      `Available palettes: ${availablePalettes}`
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
      `Invalid static files configuration: ${configPath}`
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
      `Missing or invalid "resolution-config.enabled" switch: ${configPath}`
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
      throw new Error(`Invalid resolution configuration: ${configPath}`);
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
      "Usage: node build-theme <theme-name> <frontend> <icon-pack-name>"
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

  requireDirectory(themeDir, `Theme "${themeFolder}" does not exist`);
  requireDirectory(themeAssetsDir, `Assets directory for theme "${themeFolder}" does not exist`);
  requireDirectory(palettesDir, `Palettes directory for theme "${themeFolder}" does not exist`);
  requireDirectory(iconPackDir, `Icon pack "${iconPackFolder}" does not exist`);
  requireDirectory(
    iconPackAssetsDir,
    `Assets directory for icon pack "${iconPackFolder}" does not exist`
  );
  requireDirectory(
    placeholderDir,
    `Placeholder directory for frontend "${frontendName}" does not exist`
  );

  const themeConfig = readJson(path.join(themeDir, "config.json"));
  const iconPackConfig = readJson(path.join(iconPackDir, "config.json"));
  const themeSourcePalette = readJson(path.join(themeDir, "source-palette.json"));
  const iconPackSourcePalette = readJson(
    path.join(iconPackDir, "source-palette.json")
  );

  if (!themeConfig["theme-name"]) {
    throw new Error('Missing field "theme-name" in the theme config.json');
  }

  if (!themeConfig.description || !themeConfig.Author) {
    throw new Error(
      'Missing "description" or "Author" field in the theme config.json'
    );
  }

  if (!iconPackConfig["pack-name"]) {
    throw new Error('Missing field "pack-name" in the icon pack config.json');
  }

  if (!iconPackConfig.description || !iconPackConfig.Author) {
    throw new Error(
      'Missing "description" or "Author" field in the icon pack config.json'
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
