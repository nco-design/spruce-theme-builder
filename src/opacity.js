function getOpacityPercent(asset) {
  return asset.opacity === undefined ? 100 : asset.opacity;
}

function validateAssetOpacity(asset, configPath) {
  if (asset.opacity === undefined) {
    return;
  }

  if (
    typeof asset.opacity !== "number" ||
    !Number.isFinite(asset.opacity) ||
    asset.opacity < 0 ||
    asset.opacity > 100
  ) {
    const assetName = asset["icon-name"] || asset.source || "unnamed asset";
    throw new Error(
      `Invalid opacity in ${configPath} for "${assetName}": ` +
      `${asset.opacity}. Expected a number from 0 to 100`
    );
  }
}

function applyOpacityToSharp(pipeline, asset) {
  const opacityFactor = getOpacityPercent(asset) / 100;

  if (opacityFactor === 1) {
    return pipeline;
  }

  return pipeline
    .ensureAlpha()
    .linear([1, 1, 1, opacityFactor], [0, 0, 0, 0]);
}

function applyOpacityToSvg(svgContent, asset) {
  const opacityFactor = getOpacityPercent(asset) / 100;

  if (opacityFactor === 1) {
    return svgContent;
  }

  const svgTag = svgContent.match(/<svg\b[^>]*>/i)?.[0];

  if (!svgTag) {
    throw new Error(`<svg> element not found: ${asset.source}`);
  }

  const opacityTag = `<g opacity="${opacityFactor}">`;
  return svgContent
    .replace(svgTag, `${svgTag}${opacityTag}`)
    .replace(/<\/svg>\s*$/i, "</g></svg>");
}

module.exports = {
  applyOpacityToSharp,
  applyOpacityToSvg,
  getOpacityPercent,
  validateAssetOpacity
};
