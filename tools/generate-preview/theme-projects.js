const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const THEMES_DIR = path.join(ROOT_DIR, "projects", "themes");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listThemes() {
  return fs.readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(THEMES_DIR, entry.name);
      const projectConfigPath = path.join(directory, "project-config.json");
      const projectConfig = fs.existsSync(projectConfigPath)
        ? readJson(projectConfigPath)
        : {};

      return {
        directory,
        folder: entry.name,
        name: projectConfig["theme-name"] || entry.name
      };
    })
    .sort((left, right) => left.folder.localeCompare(right.folder));
}

function findRequiredAsset(assetsDir, candidates, label) {
  for (const candidate of candidates) {
    const filePath = path.join(assetsDir, candidate);
    if (fs.existsSync(filePath)) return filePath;
  }

  throw new Error(`Missing ${label}. Expected one of: ${candidates.join(", ")}`);
}

module.exports = { findRequiredAsset, listThemes, readJson };
