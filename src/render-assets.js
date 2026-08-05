const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { applyColorMap } = require("./colors.js");
const { resolveOutputFile, resolveSourceFile } = require("./paths.js");

function isValidAssetConfig(icon) {
  return Boolean(
    icon["icon-name"] &&
    icon["target-path"] &&
    icon.source &&
    icon.format &&
    icon.width &&
    icon.height
  );
}

function getResizeOptions(asset) {
  if (asset.type === "background") {
    return { fit: "cover", position: "centre" };
  }

  return { fit: "fill" };
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
    if (!isValidAssetConfig(icon)) {
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

    const svgContent = applyColorMap(fs.readFileSync(sourceFile, "utf8"), colorMap);
    const format = icon.format.toLowerCase();
    const outputFile = resolveOutputFile(
      outputDir,
      icon["target-path"],
      `${icon["icon-name"]}.${format}`
    );

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });

    if (format === "svg") {
      fs.writeFileSync(outputFile, svgContent);
    } else if (format === "png") {
      await sharp(Buffer.from(svgContent))
        .resize(icon.width, icon.height, getResizeOptions(icon))
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

module.exports = { getResizeOptions, renderAssets };
