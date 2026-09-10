const fs = require("fs");
const path = require("path");
const { resolveWithin } = require("./paths.js");

function existsAs(filePath, type) {
  return fs.existsSync(filePath) && fs.statSync(filePath)[type]();
}

function resolveItemPath(baseDir, item) {
  return resolveWithin(baseDir, item.name);
}

function resolveTargetPath(outputDir, item) {
  const targetDir = item.target.replace(/^\/+/, "");
  return resolveWithin(outputDir, targetDir, item.name);
}

function copyFile(sourceFile, outputFile) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.copyFileSync(sourceFile, outputFile);
}

function copyFolder(sourceDir, outputDir) {
  fs.mkdirSync(path.dirname(outputDir), { recursive: true });
  fs.cpSync(sourceDir, outputDir, { force: true, recursive: true });
}

function getItemSources({ assetsDir, item, placeholderDir }) {
  const projectPath = resolveItemPath(assetsDir, item);
  const placeholderPath = resolveItemPath(placeholderDir, item);
  const expectedType = item.type === "folder" ? "isDirectory" : "isFile";

  return {
    placeholderPath,
    projectPath,
    hasPlaceholder: existsAs(placeholderPath, expectedType),
    hasProject: existsAs(projectPath, expectedType)
  };
}

function areStaticItemsAvailable({ assetsDir, items, placeholderDir }) {
  return items.every((item) => {
    const sources = getItemSources({ assetsDir, item, placeholderDir });
    return sources.hasPlaceholder || sources.hasProject;
  });
}

function copyStaticItems({ assetsDir, items, outputDir, placeholderDir }) {
  const copiedItems = [];
  const fallbackItems = [];
  const configFiles = [];

  for (const item of items) {
    const sources = getItemSources({ assetsDir, item, placeholderDir });
    const outputPath = resolveTargetPath(outputDir, item);
    const outputRelativePath = path.relative(outputDir, outputPath);

    if (!sources.hasPlaceholder && !sources.hasProject) {
      throw new Error(`Static item not found in theme or placeholders: ${item.name}`);
    }

    if (item.type === "folder") {
      if (sources.hasPlaceholder) copyFolder(sources.placeholderPath, outputPath);
      if (sources.hasProject) copyFolder(sources.projectPath, outputPath);
      if (!sources.hasProject) fallbackItems.push(outputRelativePath);
    } else {
      const sourcePath = sources.hasProject ? sources.projectPath : sources.placeholderPath;
      copyFile(sourcePath, outputPath);
      if (!sources.hasProject) fallbackItems.push(outputRelativePath);
    }

    copiedItems.push(outputRelativePath);
    if (item.type === "config-file") {
      configFiles.push({ id: item.id, fileName: outputRelativePath });
    }
  }

  return { configFiles, copiedItems, fallbackItems };
}

function findFontFiles(assetsDir) {
  const fontFiles = [];

  function scanDirectory(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(entryPath);
      } else if (entry.isFile() && /\.(ttf|otf)$/i.test(entry.name)) {
        fontFiles.push(path.relative(assetsDir, entryPath));
      }
    }
  }

  scanDirectory(assetsDir);
  return fontFiles.sort();
}

function copyProjectFonts({ assetsDir, copiedItems, outputDir }) {
  const copiedFonts = [];

  for (const relativePath of findFontFiles(assetsDir)) {
    if (copiedItems.includes(relativePath)) continue;
    copyFile(
      resolveWithin(assetsDir, relativePath),
      resolveWithin(outputDir, relativePath)
    );
    copiedFonts.push(relativePath);
  }

  return copiedFonts;
}

module.exports = {
  areStaticItemsAvailable,
  copyProjectFonts,
  copyStaticItems,
  findFontFiles
};
