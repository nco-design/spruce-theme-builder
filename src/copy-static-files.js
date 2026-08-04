const fs = require("fs");
const path = require("path");
const { resolveWithin } = require("./paths.js");

function copyRequiredFile({ assetsDir, outputDir, relativePath }) {
  const sourceFile = resolveWithin(assetsDir, relativePath);
  const outputFile = resolveWithin(outputDir, relativePath);

  if (!fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
    throw new Error(`Fichier statique obligatoire introuvable : ${sourceFile}`);
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.copyFileSync(sourceFile, outputFile);

  return relativePath;
}

function copyThemeStaticFiles({ assetsDir, outputDir }) {
  const copiedFiles = [];

  copiedFiles.push(
    copyRequiredFile({
      assetsDir,
      outputDir,
      relativePath: "config.json"
    })
  );

  return copiedFiles;
}

module.exports = { copyThemeStaticFiles };
