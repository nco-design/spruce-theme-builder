const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const readJson = require("./read-json.js");

const ROOT_DIR = path.join(__dirname, "..");

function requireDirectory(directoryPath, errorMessage) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    throw new Error(errorMessage);
  }
}

function readFrontendConfigs(frontendName, projectType) {
  const frontendDir = path.join(ROOT_DIR, "frontends", frontendName, projectType);
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

function readFrontendConfigFile(configPath) {
  const config = readJson(configPath);

  if (!Array.isArray(config.icons)) {
    throw new Error(`Le fichier ${configPath} ne contient pas de tableau "icons"`);
  }

  return config;
}

function createColorMap(buildParams, palette) {
  if (!palette.properties) {
    throw new Error('Champ manquant : "properties" dans la palette');
  }

  const colorMap = {
    [buildParams["primary-color-source"]]: palette.properties["primary-color"],
    [buildParams["primary-dark-color-source"]]: palette.properties["primary-dark"],
    [buildParams["secondary-color-source"]]: palette.properties["secondary-color"],
    [buildParams["secondary-dark-color-source"]]: palette.properties["secondary-dark"],
    [buildParams["accent-color-source"]]: palette.properties["accent-color"],
    [buildParams["background-color-source"]]: palette.properties["bg-color"]
  };

  for (const [sourceColor, targetColor] of Object.entries(colorMap)) {
    if (!sourceColor) {
      throw new Error("Une couleur source est manquante dans src/build-params.json");
    }

    if (!targetColor) {
      throw new Error(
        `Couleur de destination manquante pour la couleur source ${sourceColor}`
      );
    }
  }

  return colorMap;
}

function resolveSourceFile(assetsDir, sourcePath, sourcePrefix) {
  const relativePath = sourcePath.replace(sourcePrefix, "").replace(/^\/+/, "");
  return path.join(assetsDir, relativePath);
}

async function renderAssets({
  assetsDir,
  colorMap,
  frontendConfig,
  outputDir,
  sourcePrefix
}) {
  let generatedCount = 0;
  let skippedCount = 0;

  for (const icon of frontendConfig.icons) {
    if (
      !icon["icon-name"] ||
      !icon["target-path"] ||
      !icon.source ||
      !icon.format ||
      !icon.width ||
      !icon.height
    ) {
      process.emitWarning("Asset ignoré : configuration frontend incomplète");
      skippedCount++;
      continue;
    }

    const sourceFile = resolveSourceFile(assetsDir, icon.source, sourcePrefix);

    if (!fs.existsSync(sourceFile)) {
      process.emitWarning(`Fichier source introuvable : ${icon.source}`);
      skippedCount++;
      continue;
    }

    let svgContent = fs.readFileSync(sourceFile, "utf8");

    for (const [sourceColor, targetColor] of Object.entries(colorMap)) {
      const escapedSourceColor = sourceColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      svgContent = svgContent.replace(new RegExp(escapedSourceColor, "gi"), targetColor);
    }

    const cleanTargetPath = icon["target-path"].replace(/^\/+|\/+$/g, "");
    const targetDir = path.join(outputDir, cleanTargetPath);
    const format = icon.format.toLowerCase();
    const outputFile = path.join(targetDir, `${icon["icon-name"]}.${format}`);

    fs.mkdirSync(targetDir, { recursive: true });

    if (format === "svg") {
      fs.writeFileSync(outputFile, svgContent);
    } else if (format === "png") {
      await sharp(Buffer.from(svgContent))
        .resize(icon.width, icon.height, { fit: "fill" })
        .png()
        .toFile(outputFile);
    } else {
      process.emitWarning(
        `Format non supporté pour ${icon["icon-name"]} : ${format}`
      );
      skippedCount++;
      continue;
    }

    generatedCount++;
  }

  return { generatedCount, skippedCount };
}

async function buildTheme({ themeFolder, frontendName, iconPackFolder }) {
  if (!themeFolder || !frontendName || !iconPackFolder) {
    throw new Error(
      "Usage : node build-theme <nom-du-theme> <frontend> <nom-du-pack-d-icones>"
    );
  }

  const themeDir = path.join(ROOT_DIR, "projects", "themes", themeFolder);
  const themeAssetsDir = path.join(themeDir, "assets");
  const palettesDir = path.join(themeDir, "palettes");
  const iconPackDir = path.join(ROOT_DIR, "projects", "icon-packs", iconPackFolder);
  const iconPackAssetsDir = path.join(iconPackDir, "assets");

  requireDirectory(themeDir, `Le thème "${themeFolder}" n'existe pas`);
  requireDirectory(themeAssetsDir, `Le dossier assets du thème "${themeFolder}" n'existe pas`);
  requireDirectory(palettesDir, `Le dossier palettes du thème "${themeFolder}" n'existe pas`);
  requireDirectory(iconPackDir, `Le pack d'icônes "${iconPackFolder}" n'existe pas`);
  requireDirectory(
    iconPackAssetsDir,
    `Le dossier assets du pack d'icônes "${iconPackFolder}" n'existe pas`
  );

  const themeConfig = readJson(path.join(themeDir, "config.json"));
  const iconPackConfig = readJson(path.join(iconPackDir, "config.json"));
  const buildParams = readJson(path.join(ROOT_DIR, "src", "build-params.json"));
  const themeFrontends = readFrontendConfigs(frontendName, "theme");
  const iconPackFrontends = readFrontendConfigs(frontendName, "icon-pack");

  if (!themeConfig["theme-name"]) {
    throw new Error('Champ manquant : "theme-name" dans le config.json du thème');
  }

  if (!iconPackConfig["pack-name"]) {
    throw new Error('Champ manquant : "pack-name" dans le config.json du pack d\'icônes');
  }

  const paletteFiles = fs
    .readdirSync(palettesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
    .map((entry) => entry.name)
    .sort();

  if (paletteFiles.length === 0) {
    throw new Error(`Aucune palette trouvée pour le thème "${themeFolder}"`);
  }

  console.log(`Thème       : ${themeFolder}`);
  console.log(`Frontend    : ${frontendName}`);
  console.log(`Pack icônes : ${iconPackFolder}`);
  console.log(`Profils thème : ${themeFrontends.map((item) => item.fileName).join(", ")}`);
  console.log(
    `Profils pack  : ${iconPackFrontends.map((item) => item.fileName).join(", ")}`
  );

  for (const paletteFile of paletteFiles) {
    const palette = readJson(path.join(palettesDir, paletteFile));

    if (!palette["palette-name"]) {
      throw new Error(`Champ manquant : "palette-name" dans ${paletteFile}`);
    }

    const outputDir = path.join(
      ROOT_DIR,
      "builds",
      "themes",
      `${themeConfig["theme-name"]}-${palette["palette-name"]}`,
      frontendName
    );
    const colorMap = createColorMap(buildParams, palette);

    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\nPalette : ${palette["palette-name"]}`);
    console.log(`Sortie  : ${outputDir}`);

    const themeResult = { generatedCount: 0, skippedCount: 0 };

    for (const themeFrontend of themeFrontends) {
      const profileResult = await renderAssets({
        assetsDir: themeAssetsDir,
        colorMap,
        frontendConfig: themeFrontend.config,
        outputDir,
        sourcePrefix: /^\/?projects\//
      });
      themeResult.generatedCount += profileResult.generatedCount;
      themeResult.skippedCount += profileResult.skippedCount;
    }
    const iconPackResult = { generatedCount: 0, skippedCount: 0 };

    for (const iconPackFrontend of iconPackFrontends) {
      const profileResult = await renderAssets({
        assetsDir: iconPackAssetsDir,
        colorMap,
        frontendConfig: iconPackFrontend.config,
        outputDir,
        sourcePrefix: /^\/?projects\/icon-packs\//
      });
      iconPackResult.generatedCount += profileResult.generatedCount;
      iconPackResult.skippedCount += profileResult.skippedCount;
    }

    console.log(
      `Thème généré : ${themeResult.generatedCount} asset(s), ` +
      `${themeResult.skippedCount} ignoré(s).`
    );
    console.log(
      `Pack généré  : ${iconPackResult.generatedCount} asset(s), ` +
      `${iconPackResult.skippedCount} ignoré(s).`
    );
  }

  console.log("\nBuild terminé avec succès.");
}

module.exports = { buildTheme };
