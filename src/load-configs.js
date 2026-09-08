const fs = require("fs");
const path = require("path");
const { areStaticItemsAvailable } = require("./copy-static-files.js");
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

function readFrontendConfigs(frontendName, projectType, configNames) {
  const frontendsRoot = path.join(ROOT_DIR, "frontends");
  const frontendDir = resolveWithin(frontendsRoot, frontendName, projectType);

  requireDirectory(
    frontendDir,
    `Frontend configuration not found: ${frontendDir}`
  );

  if (!Array.isArray(configNames) || configNames.length === 0) {
    throw new Error(`No ${projectType} configuration files were declared for ${frontendName}`);
  }

  const configFiles = [...new Set(configNames)];

  return configFiles.map((fileName) => ({
    fileName,
    config: readFrontendConfigFile(resolveWithin(frontendDir, fileName))
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

function readFrontendSettings(frontendName) {
  const configPath = resolveWithin(
    path.join(ROOT_DIR, "frontends"),
    frontendName,
    "frontend.json"
  );
  const config = readJson(configPath);
  const options = config.options;

  function validateConfigName(value, property, label, required = false) {
    if (value === undefined && !required) return;
    if (typeof value !== "string" || !value) {
      throw new Error(`Invalid "${property}" for ${label}: ${configPath}`);
    }
  }

  function validateStaticItems(items, label) {
    if (!Array.isArray(items)) {
      throw new Error(`Invalid "static-files" list for ${label}: ${configPath}`);
    }

    for (const item of items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`Invalid static item for ${label}: ${configPath}`);
      }
      if (!["folder", "static-file", "config-file"].includes(item.type)) {
        throw new Error(`Invalid static item type for ${label}: ${configPath}`);
      }
      if (typeof item.name !== "string" || !item.name || typeof item.target !== "string") {
        throw new Error(`Invalid static item path for ${label}: ${configPath}`);
      }
    }
  }

  validateConfigName(config["theme-config"], "theme-config", "frontend", true);
  validateConfigName(config["icon-pack-config"], "icon-pack-config", "frontend", true);
  validateStaticItems(config["static-files"], "frontend");
  if (
    config["system-fonts"] !== undefined &&
    (!Array.isArray(config["system-fonts"]) ||
      config["system-fonts"].some((font) => typeof font !== "string" || !font))
  ) {
    throw new Error(`Invalid "system-fonts" list: ${configPath}`);
  }

  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error(`Missing or invalid "options" table: ${configPath}`);
  }

  for (const [optionName, option] of Object.entries(options)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(optionName) || optionName === "palette") {
      throw new Error(`Invalid frontend option name "${optionName}": ${configPath}`);
    }

    if (!option || typeof option !== "object" || Array.isArray(option)) {
      throw new Error(`Invalid frontend option "${optionName}": ${configPath}`);
    }

    validateConfigName(option["theme-config"], "theme-config", `frontend option "${optionName}"`);
    validateConfigName(option["icon-pack-config"], "icon-pack-config", `frontend option "${optionName}"`);
    validateStaticItems(option["static-files"] ?? [], `frontend option "${optionName}"`);
    const declaredFileCount =
      Number(option["theme-config"] !== undefined) +
      Number(option["icon-pack-config"] !== undefined) +
      (option["static-files"] ?? []).length;

    if (declaredFileCount === 0) {
      throw new Error(
        `Frontend option "${optionName}" does not declare any files: ${configPath}`
      );
    }

    if (
      option.label !== undefined &&
      (typeof option.label !== "string" || !option.label.trim())
    ) {
      throw new Error(`Invalid label for frontend option "${optionName}": ${configPath}`);
    }
  }

  return config;
}

function loadBuildContext({
  themeFolder,
  frontendName,
  frontendOptions = [],
  iconPackFolder,
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
  const frontendSettings = readFrontendSettings(frontendName);
  const selectedFrontendOptions = frontendOptions.map((optionName) => {
    const option = frontendSettings.options[optionName];
    if (!option) {
      const availableOptions = Object.keys(frontendSettings.options)
        .map((name) => `--${name}`)
        .join(", ");
      throw new Error(
        `Frontend option "--${optionName}" is not available for "${frontendName}". ` +
        `Available options: ${availableOptions || "none"}`
      );
    }
    return { name: optionName, ...option };
  });
  const staticItems = [
    ...frontendSettings["static-files"],
    ...selectedFrontendOptions.flatMap((option) => option["static-files"] ?? [])
  ];

  if (!areStaticItemsAvailable({
    assetsDir: themeAssetsDir,
    items: staticItems,
    placeholderDir
  })) {
    throw new Error(
      `Selected frontend option is not available for theme "${themeFolder}": ` +
      "a required static item is missing"
    );
  }

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
    frontendOptions: selectedFrontendOptions,
    iconPackAssetsDir,
    iconPackConfig,
    iconPackFolder,
    iconPackFrontends: readFrontendConfigs(
      frontendName,
      "icon-pack",
      [
        frontendSettings["icon-pack-config"],
        ...selectedFrontendOptions.flatMap((option) => option["icon-pack-config"] ?? [])
      ]
    ),
    iconPackSourcePalette,
    palettes: readPalettes(palettesDir, themeFolder, paletteName),
    placeholderDir,
    staticItems,
    systemFonts: frontendSettings["system-fonts"] ?? [],
    themeAssetsDir,
    themeConfig,
    themeFolder,
    themeFrontends: readFrontendConfigs(
      frontendName,
      "theme",
      [
        frontendSettings["theme-config"],
        ...selectedFrontendOptions.flatMap((option) => option["theme-config"] ?? [])
      ]
    ),
    themeSourcePalette
  };
}

module.exports = {
  loadBuildContext,
  readFrontendConfigs,
  readFrontendSettings,
  validateAssetTypes
};
