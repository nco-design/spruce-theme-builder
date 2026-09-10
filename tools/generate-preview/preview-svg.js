const fs = require("fs");
const path = require("path");
const { findRequiredAsset, readJson } = require("./theme-projects");
const { serializeEmbeddedSvg } = require("./svg-utils");

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ICON_LAYOUT = [
  { id: "fav", state: "unselected", x: 32 },
  { id: "games", state: "selected", x: 192 },
  { id: "apps", state: "unselected", x: 352 },
  { id: "settings", state: "unselected", x: 512 }
];

function readAsset(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function applyStatusColor(svgContent, sourcePrimaryColor) {
  return svgContent.replace(/#e5e5e5/gi, sourcePrimaryColor);
}

function createNavigationIcons(assetsDir) {
  return ICON_LAYOUT.map((icon) => {
    const suffix = icon.state === "selected" ? "f" : "n";
    const assetPath = findRequiredAsset(
      assetsDir,
      [
        `main-nav-icons/${icon.id}-${icon.state}.svg`,
        `main-nav-icons/${icon.id}-${suffix}.svg`
      ],
      `${icon.id} ${icon.state} navigation icon`
    );

    return serializeEmbeddedSvg(readAsset(assetPath), {
      height: 96,
      idPrefix: `preview-${icon.id}-${icon.state}`,
      preserveAspectRatio: "xMidYMid meet",
      width: 96,
      x: icon.x,
      y: 192
    });
  });
}

function createStatusIcons(assetsDir, primaryColor) {
  const statusAssets = [
    { candidates: ["icons/wifi-04.svg"], id: "wifi", label: "Wi-Fi icon", x: 560 },
    { candidates: ["icons/power-75.svg"], id: "power", label: "battery icon", x: 600 }
  ];

  return statusAssets.map((icon) => {
    const assetPath = findRequiredAsset(assetsDir, icon.candidates, icon.label);
    return serializeEmbeddedSvg(applyStatusColor(readAsset(assetPath), primaryColor), {
      height: 40,
      idPrefix: `preview-${icon.id}`,
      preserveAspectRatio: "xMidYMid meet",
      width: 40,
      x: icon.x,
      y: 10
    });
  });
}

function createPreviewSvg(themeDirectory) {
  const assetsDir = path.join(themeDirectory, "assets");
  const sourcePalette = readJson(path.join(themeDirectory, "source-palette.json"));
  const primaryColor = sourcePalette["primary-color-source"];

  if (!primaryColor) {
    throw new Error("Missing primary-color-source in source-palette.json.");
  }

  const backgroundPath = findRequiredAsset(
    assetsDir,
    ["backgrounds/main-background.svg", "backgrounds/main_background.svg"],
    "main background asset"
  );
  const background = serializeEmbeddedSvg(readAsset(backgroundPath), {
    height: 480,
    idPrefix: "preview-background",
    preserveAspectRatio: "xMidYMid slice",
    width: 640,
    x: 0,
    y: 0
  });
  const statusIcons = createStatusIcons(assetsDir, primaryColor);
  const navigationIcons = createNavigationIcons(assetsDir);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NAMESPACE}" width="640" height="480" viewBox="0 0 640 480">
  <title>Theme preview</title>
  ${background}
  <g aria-label="Status icons">
    ${statusIcons.join("\n    ")}
  </g>
  <g aria-label="Main navigation icons">
    ${navigationIcons.join("\n    ")}
  </g>
</svg>
`;
}

module.exports = { createPreviewSvg };
