const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { applyColorMap } = require("./colors.js");
const { applyOpacityToSharp, applyOpacityToSvg } = require("./opacity.js");
const { resolveOutputFile, resolveSourceFile } = require("./paths.js");
const { renderButton } = require("./render-button.js");

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

function getFlipAngle(asset) {
  return asset.flip ?? 0;
}

async function writeRotatedPng({ asset, outputFile, pipeline }) {
  const flipAngle = getFlipAngle(asset);

  if (flipAngle === 0) {
    await applyOpacityToSharp(pipeline, asset)
      .png()
      .toFile(outputFile);
    return;
  }

  // Render at the dimensions declared in the asset map first, then rotate the
  // resulting bitmap. Sharp otherwise rotates before resizing, which would
  // preserve the declared dimensions for 90° and 270° rotations.
  const rendered = await pipeline.png().toBuffer();
  await applyOpacityToSharp(sharp(rendered).rotate(flipAngle), asset)
    .png()
    .toFile(outputFile);
}

async function rotateExistingPng({ asset, outputFile }) {
  const flipAngle = getFlipAngle(asset);
  if (flipAngle === 0) return;

  const rotated = await sharp(outputFile).rotate(flipAngle).png().toBuffer();
  fs.writeFileSync(outputFile, rotated);
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
      process.emitWarning("Asset skipped: incomplete frontend configuration");
      skippedCount++;
      continue;
    }

    const sourceFile = resolveSourceFile(assetsDir, icon.source, sourcePrefix);

    if (!fs.existsSync(sourceFile)) {
      process.emitWarning(`Source file not found: ${icon.source}`);
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
      fs.writeFileSync(outputFile, applyOpacityToSvg(svgContent, icon));
    } else if (format === "png") {
      if (icon.type === "button") {
        await renderButton({
          outputFile,
          sourceName: sourceFile,
          svgContent,
          targetHeight: icon.height,
          targetWidth: icon.width,
          opacity: icon.opacity
        });
        await rotateExistingPng({ asset: icon, outputFile });
      } else {
        const pipeline = sharp(Buffer.from(svgContent)).resize(
          icon.width,
          icon.height,
          getResizeOptions(icon)
        );
        await writeRotatedPng({ asset: icon, outputFile, pipeline });
      }
    } else {
      process.emitWarning(
        `Unsupported format for ${icon["icon-name"]}: ${format}`
      );
      skippedCount++;
      continue;
    }

    generatedCount++;
  }

  return { generatedCount, skippedCount };
}

module.exports = { getFlipAngle, getResizeOptions, renderAssets };
