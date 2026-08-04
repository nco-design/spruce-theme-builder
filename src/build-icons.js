const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const readJson = require("./read-json.js");

const ROOT_DIR = path.join(__dirname, "..");

const PROJECT_TYPES = {
  theme: {
    label: "Thème",
    projectsFolder: "themes",
    buildsFolder: "themes",
    configNameField: "theme-name",
    frontendFolder: "theme",
    frontendFile: "theme.json",
    sourcePrefix: /^\/?projects\//,
    usage: "node build-theme <nom-du-theme>"
  },
  "icon-pack": {
    label: "Pack d'icônes",
    projectsFolder: "icon-packs",
    buildsFolder: "icon-packs",
    configNameField: "pack-name",
    frontendFolder: "icon-pack",
    frontendFile: "icon-pack.json",
    sourcePrefix: /^\/?projects\/icons\//,
    usage: "node build-icon-pack <nom-du-pack>"
  }
};

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
      process.emitWarning("Asset ignoré : configuration incomplète dans le frontend");
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

  return { generatedCount, skippedCount };
}

async function buildProject({ projectType, projectFolder }) {
  const typeConfig = PROJECT_TYPES[projectType];

  if (!typeConfig) {
    throw new Error(`Type de projet inconnu : ${projectType}`);
  }

  if (!projectFolder) {
    throw new Error(`Usage : ${typeConfig.usage}`);
  }

  const sourceDir = path.join(
    ROOT_DIR,
    "projects",
    typeConfig.projectsFolder,
    projectFolder
  );
  const assetsDir = path.join(sourceDir, "assets");
  const palettesDir = path.join(sourceDir, "palettes");

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Le dossier "${projectFolder}" n'existe pas`);
  }

  if (!fs.existsSync(assetsDir)) {
    throw new Error(`Le dossier assets de "${projectFolder}" n'existe pas`);
  }

  if (!fs.existsSync(palettesDir)) {
    throw new Error(`Le dossier palettes de "${projectFolder}" n'existe pas`);
  }

  const projectConfig = readJson(path.join(sourceDir, "config.json"));
  const buildParams = readJson(path.join(ROOT_DIR, "src", "build-params.json"));
  const frontendConfig = readJson(
    path.join(
      ROOT_DIR,
      "frontends",
      "spruceos",
      typeConfig.frontendFolder,
      typeConfig.frontendFile
    )
  );

  if (!projectConfig[typeConfig.configNameField]) {
    throw new Error(
      `Champ manquant : "${typeConfig.configNameField}" dans le config.json du projet`
    );
  }

  if (!Array.isArray(frontendConfig.icons)) {
    throw new Error(`Le fichier ${typeConfig.frontendFile} ne contient pas de tableau "icons"`);
  }

  const paletteFiles = fs
    .readdirSync(palettesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
    .map((entry) => entry.name)
    .sort();

  if (paletteFiles.length === 0) {
    throw new Error(`Aucune palette trouvée pour "${projectFolder}"`);
  }

  console.log(`${typeConfig.label} : ${projectFolder}`);
  console.log(`Source  : ${sourceDir}`);
  console.log("Frontend: spruceos (480p 4:3)");

  for (const paletteFile of paletteFiles) {
    const palette = readJson(path.join(palettesDir, paletteFile));

    if (!palette["palette-name"]) {
      throw new Error(`Champ manquant : "palette-name" dans ${paletteFile}`);
    }

    const buildFolderName =
      `${projectConfig[typeConfig.configNameField]}-${palette["palette-name"]}`;
    const outputDir = path.join(
      ROOT_DIR,
      "builds",
      typeConfig.buildsFolder,
      buildFolderName
    );
    const colorMap = createColorMap(buildParams, palette);

    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\nPalette : ${palette["palette-name"]}`);
    console.log(`Sortie  : ${outputDir}`);

    const result = await renderAssets({
      assetsDir,
      colorMap,
      frontendConfig,
      outputDir,
      sourcePrefix: typeConfig.sourcePrefix
    });

    console.log(
      `Palette terminée : ${result.generatedCount} asset(s) généré(s), ` +
      `${result.skippedCount} ignoré(s).`
    );
  }

  console.log("\nBuild terminé avec succès.");
}

module.exports = { buildProject };
