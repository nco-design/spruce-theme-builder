function createColorMap(buildParams, palette) {
  if (!palette.properties) {
    throw new Error('Champ manquant : "properties" dans la palette');
  }

  const colorMap = {
    [buildParams["primary-color-source"]]: palette.properties["primary-color"],
    [buildParams["primary-dark-color-source"]]: palette.properties["primary-dark"],
    [buildParams["secondary-color-source"]]: palette.properties["secondary-color"],
    [buildParams["secondary-dark-color-source"]]: palette.properties["secondary-dark"],
    [buildParams["accent-color-source"]]: palette.properties["accent-color"],
    [buildParams["background-color-source"]]: palette.properties["bg-color"]
  };

  for (const [sourceColor, targetColor] of Object.entries(colorMap)) {
    if (!sourceColor) {
      throw new Error("Une couleur source est manquante dans src/build-params.json");
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
