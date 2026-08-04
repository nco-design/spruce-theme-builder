const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

function requireDirectory(directoryPath, errorMessage) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    throw new Error(errorMessage);
  }
}

function resolveWithin(baseDir, ...parts) {
  const basePath = path.resolve(baseDir);
  const resolvedPath = path.resolve(basePath, ...parts);

  if (resolvedPath !== basePath && !resolvedPath.startsWith(`${basePath}${path.sep}`)) {
    throw new Error(`Chemin hors du dossier autorisé : ${resolvedPath}`);
  }

  return resolvedPath;
}

function resolveSourceFile(assetsDir, sourcePath, sourcePrefix) {
  const relativePath = sourcePath.replace(sourcePrefix, "").replace(/^\/+/, "");
  return resolveWithin(assetsDir, relativePath);
}

function resolveOutputFile(outputDir, targetPath, fileName) {
  const cleanTargetPath = targetPath.replace(/^\/+|\/+$/g, "");
  return resolveWithin(outputDir, cleanTargetPath, fileName);
}

module.exports = {
  ROOT_DIR,
  requireDirectory,
  resolveOutputFile,
  resolveSourceFile,
  resolveWithin
};
