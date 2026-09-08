const fs = require("fs");
const path = require("path");
const { createColorMap } = require("./colors.js");
const {
  copyProjectFonts,
  copyStaticItems
} = require("./copy-static-files.js");
const { injectPaletteIntoConfig } = require("./inject-config.js");
const { loadBuildContext } = require("./load-configs.js");
const { ROOT_DIR, resolveWithin } = require("./paths.js");
const { renderAssets } = require("./render-assets.js");
const { validateStaticFiles } = require("./validate-static-files.js");

async function renderProfiles({
  assetsDir,
  colorMap,
  outputDir,
  profiles,
  sourcePrefix
}) {
  const result = { generatedCount: 0, skippedCount: 0 };

  for (const profile of profiles) {
    const profileResult = await renderAssets({
      assetsDir,
      colorMap,
      frontendConfig: profile.config,
      outputDir,
      sourcePrefix
    });
    result.generatedCount += profileResult.generatedCount;
    result.skippedCount += profileResult.skippedCount;
  }

  return result;
}

async function buildTheme(options) {
  const context = loadBuildContext(options);

  console.log(`Theme       : ${context.themeFolder}`);
  console.log(`Frontend    : ${context.frontendName}`);
  console.log(`Icon pack   : ${context.iconPackFolder}`);
  console.log(
    `Options      : ${context.frontendOptions.map((option) => `--${option.name}`).join(", ") || "none"}`
  );
  console.log(
    `Theme profiles    : ${context.themeFrontends.map((item) => item.fileName).join(", ")}`
  );
  console.log(
    `Icon pack profiles: ${context.iconPackFrontends.map((item) => item.fileName).join(", ")}`
  );

  const frontendBuildDir = resolveWithin(
    path.join(ROOT_DIR, "builds"),
    context.frontendName
  );

  for (const { palette } of context.palettes) {
    const outputDir = resolveWithin(
      frontendBuildDir,
      `${context.themeConfig["theme-name"]}-${palette["palette-name"]}`
    );
    const themeColorMap = createColorMap(
      context.themeSourcePalette,
      palette,
      "theme"
    );
    const iconPackColorMap = createColorMap(
      context.iconPackSourcePalette,
      palette,
      "icon pack"
    );

    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\nPalette: ${palette["palette-name"]}`);
    console.log(`Output : ${outputDir}`);

    const staticCopyResult = copyStaticItems({
      assetsDir: context.themeAssetsDir,
      items: context.staticItems,
      outputDir,
      placeholderDir: context.placeholderDir
    });
    const copiedFonts = copyProjectFonts({
      assetsDir: context.themeAssetsDir,
      copiedItems: staticCopyResult.copiedItems,
      outputDir
    });
    console.log(
      `Static files: ${[...staticCopyResult.copiedItems, ...copiedFonts].join(", ")}`
    );
    for (const fallbackFile of staticCopyResult.fallbackItems) {
      console.log(`Fallback used: ${fallbackFile}`);
    }

    let injectedConfigValues = 0;
    for (const configFileName of staticCopyResult.configFiles) {
      injectedConfigValues += injectPaletteIntoConfig({
        configFileName,
        frontendName: context.frontendName,
        iconPackConfig: context.iconPackConfig,
        outputDir,
        palette,
        themeConfig: context.themeConfig
      });
    }
    console.log(`Colors injected: ${injectedConfigValues}`);

    const staticValidation = validateStaticFiles({
      outputDir,
      systemFonts: context.systemFonts
    });
    console.log(
      `Validated files: ${staticValidation.validatedFonts} font(s), ` +
      `${staticValidation.validatedSounds} sound file(s)`
    );

    const themeResult = await renderProfiles({
      assetsDir: context.themeAssetsDir,
      colorMap: themeColorMap,
      outputDir,
      profiles: context.themeFrontends,
      sourcePrefix: /^\/?projects\//
    });
    const iconPackResult = await renderProfiles({
      assetsDir: context.iconPackAssetsDir,
      colorMap: iconPackColorMap,
      outputDir,
      profiles: context.iconPackFrontends,
      sourcePrefix: /^\/?projects\/icon-packs\//
    });

    console.log(
      `Theme generated: ${themeResult.generatedCount} asset(s), ` +
      `${themeResult.skippedCount} skipped.`
    );
    console.log(
      `Icon pack generated: ${iconPackResult.generatedCount} asset(s), ` +
      `${iconPackResult.skippedCount} skipped.`
    );
  }

  console.log("\nBuild completed successfully.");
}

module.exports = { buildTheme };
