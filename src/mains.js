const fs = require("fs");
const path = require("path");
const { createColorMap } = require("./colors.js");
const { copyThemeStaticFiles } = require("./copy-static-files.js");
const { prepareResolutionConfig } = require("./generate-resolution-config.js");
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

    const staticCopyResult = copyThemeStaticFiles({
      assetsDir: context.themeAssetsDir,
      outputDir,
      placeholderDir: context.placeholderDir,
      staticFiles: context.staticFiles
    });
    console.log(`Static files: ${staticCopyResult.copiedFiles.join(", ")}`);
    for (const fallbackFile of staticCopyResult.fallbackFiles) {
      console.log(`Fallback used: ${fallbackFile}`);
    }

    const injectedConfigValues = injectPaletteIntoConfig({
      frontendName: context.frontendName,
      iconPackConfig: context.iconPackConfig,
      outputDir,
      palette,
      themeConfig: context.themeConfig
    });
    console.log(`Colors injected: ${injectedConfigValues}`);

    const resolutionConfig = context.include720p
      ? prepareResolutionConfig({
          assetsDir: context.themeAssetsDir,
          outputDir,
          settings: context.frontendSettings["resolution-config"]
        })
      : { enabled: false };

    if (resolutionConfig.enabled) {
      injectPaletteIntoConfig({
        configFileName: resolutionConfig.fileName,
        frontendName: context.frontendName,
        iconPackConfig: context.iconPackConfig,
        outputDir,
        palette,
        themeConfig: context.themeConfig
      });
      console.log(
        `HD configuration: ${resolutionConfig.fileName} (${resolutionConfig.mode})`
      );
    } else {
      console.log(
        context.include720p
          ? "HD configuration: disabled for this frontend"
          : "HD configuration: not requested"
      );
    }

    const staticValidation = validateStaticFiles({
      outputDir,
      staticFiles: context.staticFiles
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
