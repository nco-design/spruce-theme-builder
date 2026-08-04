const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const readJson = require("./src/read-json.js");

const ROOT_DIR = __dirname;
const themeFolder = process.argv[2];

if (!themeFolder) {
  throw new Error("Usage : node build-theme.js <nom-du-theme>");
}

const sourceDir = path.join(ROOT_DIR, "projects", "themes", themeFolder);
const assetsDir = path.join(sourceDir, "assets");
const themeConfigPath = path.join(sourceDir, "config.json");
const palettesDir = path.join(sourceDir, "palettes");
const buildParamsPath = path.join(ROOT_DIR, "src", "build-params.json");
const frontendConfigPath = path.join(
  ROOT_DIR,
  "frontends",
  "spruceos",
  "theme",
  "theme.json"
);

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Le dossier thème "${themeFolder}" n'existe pas`);
}

if (!fs.existsSync(assetsDir)) {
  throw new Error(`Le dossier assets du thème "${themeFolder}" n'existe pas`);
}

const buildParams = readJson(buildParamsPath);
const themeConfig = readJson(themeConfigPath);
const frontendConfig = readJson(frontendConfigPath);

if (!themeConfig["theme-name"]) {
  throw new Error('Champ manquant : "theme-name" dans le config.json du thème');
}

if (!Array.isArray(frontendConfig.icons)) {
  throw new Error('Le fichier theme.json ne contient pas de tableau "icons"');
}

if (!fs.existsSync(palettesDir)) {
  throw new Error(`Le dossier palettes du thème "${themeFolder}" n'existe pas`);
}

const paletteFiles = fs
  .readdirSync(palettesDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
  .map((entry) => entry.name)
  .sort();

if (paletteFiles.length === 0) {
  throw new Error(`Aucune palette trouvée pour le thème "${themeFolder}"`);
}

function createColorMap(palette) {
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

function resolveSourceFile(sourcePath) {
  const projectPath = sourcePath.replace(/^\/?projects\//, "").replace(/^\/+/, "");
  return path.join(assetsDir, projectPath);
}

async function buildPalette(paletteFile) {
  const palettePath = path.join(palettesDir, paletteFile);
  const palette = readJson(palettePath);

  if (!palette["palette-name"]) {
    throw new Error(`Champ manquant : "palette-name" dans ${paletteFile}`);
  }

  const buildFolderName = `${themeConfig["theme-name"]}-${palette["palette-name"]}`;
  const outputDir = path.join(ROOT_DIR, "builds", "themes", buildFolderName);
  const colorMap = createColorMap(palette);

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\nPalette : ${palette["palette-name"]}`);
  console.log(`Sortie  : ${outputDir}`);

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
      process.emitWarning("Asset ignoré : configuration incomplète dans theme.json");
      skippedCount++;
      continue;
    }

    const sourceFile = resolveSourceFile(icon.source);

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
    const targetDir = path.join(outputDir, "spruceos", cleanTargetPath);
    const format = icon.format.toLowerCase();
    const outputFile = path.join(targetDir, `${icon["icon-name"]}.${format}`);

    fs.mkdirSync(targetDir, { recursive: true });

    if (format === "svg") {
      fs.writeFileSync(outputFile, svgContent);
    } else if (format === "png") {
      await sharp(Buffer.from(svgContent))
        .resize(icon.width, icon.height)
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
    console.log(`  Asset généré : ${path.relative(outputDir, outputFile)}`);
  }

  console.log(
    `Palette terminée : ${generatedCount} asset(s) généré(s), ${skippedCount} ignoré(s).`
  );
}

async function buildTheme() {
  console.log(`Thème   : ${themeFolder}`);
  console.log(`Source  : ${sourceDir}`);
  console.log(`Frontend: spruceos (480p 4:3)`);

  for (const paletteFile of paletteFiles) {
    await buildPalette(paletteFile);
  }

  console.log("\nBuild terminé avec succès.");
}

buildTheme().catch((error) => {
  console.error("\nErreur pendant le build :", error);
  process.exitCode = 1;
});
