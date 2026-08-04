const fs = require("fs");
const path = require("path");
const { createColorMap } = require("./colors.js");
const { copyThemeStaticFiles } = require("./copy-static-files.js");
const { injectPaletteIntoConfig } = require("./inject-config.js");
const { loadBuildContext } = require("./load-configs.js");
const { ROOT_DIR, resolveWithin } = require("./paths.js");
const { renderAssets } = require("./render-assets.js");

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

  console.log(`Thème       : ${context.themeFolder}`);
  console.log(`Frontend    : ${context.frontendName}`);
  console.log(`Pack icônes : ${context.iconPackFolder}`);
  console.log(
    `Profils thème : ${context.themeFrontends.map((item) => item.fileName).join(", ")}`
  );
  console.log(
    `Profils pack  : ${context.iconPackFrontends.map((item) => item.fileName).join(", ")}`
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
    const colorMap = createColorMap(context.buildParams, palette);

    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\nPalette : ${palette["palette-name"]}`);
    console.log(`Sortie  : ${outputDir}`);

    const copiedFiles = copyThemeStaticFiles({
      assetsDir: context.themeAssetsDir,
      outputDir,
      placeholderDir: context.placeholderDir,
      staticFiles: context.staticFiles
    });
    console.log(`Fichiers statiques : ${copiedFiles.join(", ")}`);

    const injectedConfigValues = injectPaletteIntoConfig({
      frontendName: context.frontendName,
      outputDir,
      palette,
      themeConfig: context.themeConfig
    });
    console.log(`Couleurs injectées : ${injectedConfigValues}`);

    const themeResult = await renderProfiles({
      assetsDir: context.themeAssetsDir,
      colorMap,
      outputDir,
      profiles: context.themeFrontends,
      sourcePrefix: /^\/?projects\//
    });
    const iconPackResult = await renderProfiles({
      assetsDir: context.iconPackAssetsDir,
      colorMap,
      outputDir,
      profiles: context.iconPackFrontends,
      sourcePrefix: /^\/?projects\/icon-packs\//
    });

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
