function createColorMap(sourcePalette, palette, projectLabel = "project") {
  if (!palette.properties) {
    throw new Error('Missing field "properties" in palette');
  }

  const colorMap = {
    [sourcePalette["primary-color-source"]]: palette.properties["primary-color"],
    [sourcePalette["primary-dark-color-source"]]: palette.properties["primary-dark"],
    [sourcePalette["secondary-color-source"]]: palette.properties["secondary-color"],
    [sourcePalette["secondary-dark-color-source"]]: palette.properties["secondary-dark"],
    [sourcePalette["accent-color-source"]]: palette.properties["accent-color"],
    [sourcePalette["background-color-source"]]: palette.properties["bg-color"]
  };

  for (const [sourceColor, targetColor] of Object.entries(colorMap)) {
    if (!sourceColor) {
      throw new Error(
        `A source color is missing from the ${projectLabel} source-palette.json`
      );
    }

    if (!targetColor) {
      throw new Error(
        `Missing target color for source color ${sourceColor}`
      );
    }
  }

  return colorMap;
}

function applyColorMap(content, colorMap) {
  let result = content;

  for (const [sourceColor, targetColor] of Object.entries(colorMap)) {
    const escapedSourceColor = sourceColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escapedSourceColor, "gi"), targetColor);
  }

  return result;
}

module.exports = { applyColorMap, createColorMap };
