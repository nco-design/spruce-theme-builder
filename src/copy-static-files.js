const fs = require("fs");
const path = require("path");
const { resolveWithin } = require("./paths.js");

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function copyFile({ outputDir, relativePath, sourceDir }) {
  const sourceFile = resolveWithin(sourceDir, relativePath);
  const outputFile = resolveWithin(outputDir, relativePath);

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.copyFileSync(sourceFile, outputFile);

  return relativePath;
}

function copyRequiredFile({ assetsDir, outputDir, placeholderDir, relativePath }) {
  const projectFile = resolveWithin(assetsDir, relativePath);

  if (isFile(projectFile)) {
    return copyFile({
      outputDir,
      relativePath,
      sourceDir: assetsDir
    });
  }

  const placeholderFile = resolveWithin(placeholderDir, relativePath);

  if (isFile(placeholderFile)) {
    return copyFile({
      outputDir,
      relativePath,
      sourceDir: placeholderDir
    });
  }

  throw new Error(
    `Fichier statique obligatoire introuvable dans le thème et les placeholders : ` +
    relativePath
  );
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

function copyThemeStaticFiles({ assetsDir, outputDir, placeholderDir, staticFiles }) {
  const copiedFiles = [];

  for (const relativePath of staticFiles.required) {
    copiedFiles.push(copyRequiredFile({
      assetsDir,
      outputDir,
      placeholderDir,
      relativePath
    }));
  }

  const projectFonts = findFontFiles(assetsDir);
  const fontSourceDir = projectFonts.length > 0 ? assetsDir : placeholderDir;
  const fontFiles = projectFonts.length > 0
    ? projectFonts
    : findFontFiles(placeholderDir);

  if (fontFiles.length === 0) {
    throw new Error(
      "Aucune police .ttf ou .otf trouvée dans le thème ou les placeholders"
    );
  }

  for (const relativePath of fontFiles) {
    if (copiedFiles.includes(relativePath)) {
      continue;
    }

    copiedFiles.push(copyFile({
      outputDir,
      relativePath,
      sourceDir: fontSourceDir
    }));
  }

  return copiedFiles;
}

module.exports = { copyThemeStaticFiles, findFontFiles };
