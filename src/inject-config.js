const fs = require("fs");
const path = require("path");
const { createGeneratedNotice } = require("./generated-notice.js");
const readJson = require("./read-json.js");
const { resolveWithin } = require("./paths.js");

const FORBIDDEN_PATH_PARTS = new Set(["__proto__", "constructor", "prototype"]);

function getPaletteBindings(themeConfig, frontendName) {
  const frontendConfig = themeConfig["frontend-configs"]?.[frontendName];
  const bindings = frontendConfig?.["palette-bindings"];

  if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
    throw new Error(
      `Missing or invalid "frontend-configs.${frontendName}.palette-bindings" table`
    );
  }

  return bindings;
}

function getConfigOverrides(themeConfig, frontendName, configFileId) {
  const frontendConfig = themeConfig["frontend-configs"]?.[frontendName];
  const configOverrides = frontendConfig?.["config-overrides"];

  if (configOverrides === undefined) return {};
  if (!configOverrides || typeof configOverrides !== "object" || Array.isArray(configOverrides)) {
    throw new Error(
      `Invalid "frontend-configs.${frontendName}.config-overrides" table`
    );
  }

  const overrides = configOverrides[configFileId];
  if (overrides === undefined) return {};
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new Error(
      `Invalid config overrides for "${frontendName}" config-file "${configFileId}"`
    );
  }

  return overrides;
}

function setConfigPath(config, configPath, value) {
  const parts = configPath.split(".");

  if (parts.some((part) => !part || FORBIDDEN_PATH_PARTS.has(part))) {
    throw new Error(`Invalid configuration path: ${configPath}`);
  }

  let current = config;

  for (const part of parts.slice(0, -1)) {
    if (!Object.hasOwn(current, part) || typeof current[part] !== "object") {
      throw new Error(`Parent path not found in config.json: ${configPath}`);
    }
    current = current[part];
  }

  current[parts.at(-1)] = value;
}

function joinDescriptions(...descriptions) {
  const parts = descriptions
    .map((description) => description?.trim().replace(/\.+$/, ""))
    .filter(Boolean);

  return parts.length > 0 ? `${parts.join(". ")}.` : "";
}

function joinAuthors(themeAuthor, iconPackAuthor) {
  const authors = [themeAuthor, iconPackAuthor]
    .map((author) => author?.trim())
    .filter(Boolean);

  return [...new Set(authors)].join(" and ");
}

function createMetadata({ iconPackConfig, palette, themeConfig }) {
  return {
    name: `${themeConfig["theme-name"]}-${palette["palette-name"]}`,
    description: joinDescriptions(
      themeConfig.description,
      palette.description,
      iconPackConfig.description
    ),
    author: joinAuthors(themeConfig.Author, iconPackConfig.Author),
    ...createGeneratedNotice()
  };
}

function injectPaletteIntoConfig({
  configFileId,
  configFileName = "config.json",
  frontendName,
  iconPackConfig,
  outputDir,
  palette,
  themeConfig
}) {
  const outputConfigPath = resolveWithin(outputDir, configFileName);
  const outputConfig = readJson(outputConfigPath);
  const bindings = getPaletteBindings(themeConfig, frontendName);
  const overrides = getConfigOverrides(themeConfig, frontendName, configFileId);

  for (const [configPath, paletteProperty] of Object.entries(bindings)) {
    const value = palette.properties?.[paletteProperty];

    if (!value) {
      throw new Error(
        `Color "${paletteProperty}" not found for path "${configPath}"`
      );
    }

    setConfigPath(outputConfig, configPath, value);
  }

  for (const [configPath, value] of Object.entries(overrides)) {
    setConfigPath(outputConfig, configPath, value);
  }

  const metadata = createMetadata({ iconPackConfig, palette, themeConfig });
  const finalConfig = Object.assign({}, metadata, outputConfig, metadata);

  fs.writeFileSync(outputConfigPath, `${JSON.stringify(finalConfig, null, 4)}\n`);

  return {
    overrideCount: Object.keys(overrides).length,
    paletteCount: Object.keys(bindings).length
  };
}

module.exports = {
  createMetadata,
  getConfigOverrides,
  injectPaletteIntoConfig,
  joinAuthors,
  joinDescriptions
};
