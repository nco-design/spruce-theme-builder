const fs = require("fs");
const path = require("path");
const readJson = require("./read-json.js");
const { ROOT_DIR, requireDirectory, resolveWithin } = require("./paths.js");

function readFrontendConfigFile(configPath) {
  const config = readJson(configPath);

  if (!Array.isArray(config.icons)) {
    throw new Error(`Le fichier ${configPath} ne contient pas de tableau "icons"`);
  }

  return config;
}

function readFrontendConfigs(frontendName, projectType) {
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
        (entry.name === mainConfigName || optionalConfigPattern.test(entry.name))
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

function readPalettes(palettesDir, themeFolder) {
  const paletteFiles = fs
    .readdirSync(palettesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
    .map((entry) => entry.name)
    .sort();

  if (paletteFiles.length === 0) {
    throw new Error(`Aucune palette trouvée pour le thème "${themeFolder}"`);
  }

  return paletteFiles.map((fileName) => {
    const palette = readJson(path.join(palettesDir, fileName));

    if (!palette["palette-name"]) {
      throw new Error(`Champ manquant : "palette-name" dans ${fileName}`);
    }

    return { fileName, palette };
  });
}

function readStaticFilesConfig(frontendName) {
  const configPath = resolveWithin(
    path.join(ROOT_DIR, "frontends"),
    frontendName,
    "theme",
    "static-files.json"
  );
  const config = readJson(configPath);

  if (!Array.isArray(config.required) || !Array.isArray(config.optional)) {
    throw new Error(
      `Le fichier ${configPath} doit contenir les tableaux "required" et "optional"`
    );
  }

  return config;
}

function loadBuildContext({ themeFolder, frontendName, iconPackFolder }) {
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

  if (!themeConfig["theme-name"]) {
    throw new Error('Champ manquant : "theme-name" dans le config.json du thème');
  }

  if (!iconPackConfig["pack-name"]) {
    throw new Error('Champ manquant : "pack-name" dans le config.json du pack d\'icônes');
  }

  return {
    buildParams: readJson(path.join(ROOT_DIR, "src", "build-params.json")),
    frontendName,
    iconPackAssetsDir,
    iconPackFolder,
    iconPackFrontends: readFrontendConfigs(frontendName, "icon-pack"),
    palettes: readPalettes(palettesDir, themeFolder),
    placeholderDir,
    staticFiles: readStaticFilesConfig(frontendName),
    themeAssetsDir,
    themeConfig,
    themeFolder,
    themeFrontends: readFrontendConfigs(frontendName, "theme")
  };
}

module.exports = { loadBuildContext, readFrontendConfigs };
