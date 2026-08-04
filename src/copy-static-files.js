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

function findFontFiles(assetsDir) {
  const fontFiles = [];

  function scanDirectory(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(entryPath);
        continue;
      }

      if (entry.isFile() && /\.(ttf|otf)$/i.test(entry.name)) {
        fontFiles.push(path.relative(assetsDir, entryPath));
      }
    }
  }

  scanDirectory(assetsDir);

  return fontFiles.sort();
}

function copyThemeStaticFiles({ assetsDir, outputDir, staticFiles }) {
  const copiedFiles = [];

  for (const relativePath of staticFiles.required) {
    copiedFiles.push(copyRequiredFile({
      assetsDir,
      outputDir,
      relativePath
    }));
  }

  for (const relativePath of findFontFiles(assetsDir)) {
    if (copiedFiles.includes(relativePath)) {
      continue;
    }

    copiedFiles.push(copyRequiredFile({
      assetsDir,
      outputDir,
      relativePath
    }));
  }

  return copiedFiles;
}

module.exports = { copyThemeStaticFiles, findFontFiles };
