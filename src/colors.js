function createColorMap(sourcePalette, palette, projectLabel = "projet") {
  if (!palette.properties) {
    throw new Error('Champ manquant : "properties" dans la palette');
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
        `Une couleur source est manquante dans le source-palette.json du ${projectLabel}`
      );
    }

    if (!targetColor) {
      throw new Error(
        `Couleur de destination manquante pour la couleur source ${sourceColor}`
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
