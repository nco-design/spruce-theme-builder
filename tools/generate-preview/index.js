const fs = require("fs");
const path = require("path");
const { chooseTheme } = require("./theme-selector");
const { createPreviewSvg } = require("./preview-svg");
const { listThemes } = require("./theme-projects");

async function runGeneratePreview() {
  const themes = listThemes();
  if (themes.length === 0) {
    throw new Error("No theme projects were found.");
  }

  const theme = await chooseTheme(themes);
  if (!theme) return;

  const outputPath = path.join(theme.directory, "assets", "preview.svg");
  fs.writeFileSync(outputPath, createPreviewSvg(theme.directory), "utf8");
  console.log(`\nPreview generated: ${outputPath}`);
}

module.exports = { createPreviewSvg, listThemes, runGeneratePreview };
