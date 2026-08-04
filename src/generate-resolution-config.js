const fs = require("fs");
const readJson = require("./read-json.js");
const { resolveWithin } = require("./paths.js");

function scaleIntegerValues(value, scale) {
  if (Array.isArray(value)) {
    return value.map((item) => scaleIntegerValues(item, scale));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        scaleIntegerValues(item, scale)
      ])
    );
  }

  if (Number.isInteger(value)) {
    return Math.floor(value * scale);
  }

  return value;
}

function generateResolutionConfig({
  outputDir,
  outputFileName,
  scale,
  sourceFileName = "config.json"
}) {
  const sourcePath = resolveWithin(outputDir, sourceFileName);
  const outputPath = resolveWithin(outputDir, outputFileName);
  const sourceConfig = readJson(sourcePath);
  const resolutionConfig = scaleIntegerValues(sourceConfig, scale);

  fs.writeFileSync(outputPath, `${JSON.stringify(resolutionConfig, null, 4)}\n`);

  return outputFileName;
}

function prepareResolutionConfig({ assetsDir, outputDir, settings }) {
  if (!settings.enabled) {
    return { enabled: false };
  }

  const manualConfigPath = resolveWithin(assetsDir, settings["manual-file"]);
  const outputPath = resolveWithin(outputDir, settings["output-file"]);

  if (fs.existsSync(manualConfigPath) && fs.statSync(manualConfigPath).isFile()) {
    fs.copyFileSync(manualConfigPath, outputPath);
    return {
      enabled: true,
      fileName: settings["output-file"],
      mode: "manual"
    };
  }

  generateResolutionConfig({
    outputDir,
    outputFileName: settings["output-file"],
    scale: settings.scale,
    sourceFileName: settings["source-file"]
  });

  return {
    enabled: true,
    fileName: settings["output-file"],
    mode: "generated"
  };
}

module.exports = {
  generateResolutionConfig,
  prepareResolutionConfig,
  scaleIntegerValues
};
