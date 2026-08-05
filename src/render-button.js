const sharp = require("sharp");

function getSvgAttribute(svgTag, attributeName) {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = svgTag.match(
    new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(["'])(.*?)\\1`, "i")
  );

  return match?.[2];
}

function setSvgAttribute(svgTag, attributeName, value) {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attributePattern = new RegExp(
    `((?:^|\\s)${escapedName}\\s*=\\s*)(["'])(.*?)\\2`,
    "i"
  );

  if (attributePattern.test(svgTag)) {
    return svgTag.replace(attributePattern, `$1"${value}"`);
  }

  return svgTag.replace(/\s*\/?>(?=\s*$)/, (ending) =>
    ` ${attributeName}="${value}"${ending.trimStart()}`
  );
}

function parseSvgNumber(value, attributeName, sourceName, { minimum } = {}) {
  if (typeof value !== "string") {
    throw new Error(
      `Attribut "${attributeName}" absent dans le bouton SVG : ${sourceName}`
    );
  }

  const match = value
    .trim()
    .match(/^([+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?))(?:px)?$/i);
  const number = match ? Number(match[1]) : Number.NaN;

  if (
    !Number.isFinite(number) ||
    (Number.isFinite(minimum) && number < minimum)
  ) {
    throw new Error(
      `Attribut "${attributeName}" invalide dans le bouton SVG ` +
      `${sourceName} : "${value}"`
    );
  }

  return number;
}

function parseSvgLength(value, attributeName, sourceName) {
  const number = parseSvgNumber(value, attributeName, sourceName);

  if (number <= 0) {
    throw new Error(
      `Attribut "${attributeName}" invalide dans le bouton SVG ` +
      `${sourceName} : "${value}"`
    );
  }

  return number;
}

function formatSvgNumber(value) {
  return String(Number(value.toFixed(6)));
}

function scaleRectangleStrokeWidths(rectTag, scale, sourceName) {
  let transformedRect = rectTag;
  const strokeWidth = getSvgAttribute(rectTag, "stroke-width");

  if (strokeWidth !== undefined) {
    transformedRect = setSvgAttribute(
      transformedRect,
      "stroke-width",
      formatSvgNumber(
        parseSvgNumber(strokeWidth, "stroke-width", sourceName, { minimum: 0 }) *
        scale
      )
    );
  }

  const style = getSvgAttribute(transformedRect, "style");

  if (style !== undefined) {
    const transformedStyle = style.replace(
      /(stroke-width\s*:\s*)([+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?))(px)?/gi,
      (match, prefix, value, unit = "") =>
        `${prefix}${formatSvgNumber(Number(value) * scale)}${unit}`
    );
    transformedRect = setSvgAttribute(transformedRect, "style", transformedStyle);
  }

  return transformedRect;
}

function transformButtonRectangles({
  sourceName = "bouton sans nom",
  svgContent,
  targetHeight,
  targetWidth
}) {
  const geometry = readButtonGeometry({
    sourceName,
    svgContent,
    targetHeight,
    targetWidth
  });
  const { minX, minY, width: viewBoxWidth, height: viewBoxHeight } =
    geometry.source.viewBox;
  const scaleX = geometry.target.width / viewBoxWidth;
  const scaleY = geometry.target.height / viewBoxHeight;
  let rectangleCount = 0;

  let transformedSvg = svgContent.replace(/<rect\b[^>]*>/gi, (rectTag) => {
    rectangleCount += 1;

    const x = getSvgAttribute(rectTag, "x") === undefined
      ? 0
      : parseSvgNumber(getSvgAttribute(rectTag, "x"), "x", sourceName);
    const y = getSvgAttribute(rectTag, "y") === undefined
      ? 0
      : parseSvgNumber(getSvgAttribute(rectTag, "y"), "y", sourceName);
    const width = parseSvgLength(
      getSvgAttribute(rectTag, "width"),
      "rect width",
      sourceName
    );
    const height = parseSvgLength(
      getSvgAttribute(rectTag, "height"),
      "rect height",
      sourceName
    );

    let transformedRect = setSvgAttribute(
      rectTag,
      "x",
      formatSvgNumber((x - minX) * scaleX)
    );
    transformedRect = setSvgAttribute(
      transformedRect,
      "y",
      formatSvgNumber((y - minY) * scaleY)
    );
    transformedRect = setSvgAttribute(
      transformedRect,
      "width",
      formatSvgNumber(width * scaleX)
    );
    transformedRect = setSvgAttribute(
      transformedRect,
      "height",
      formatSvgNumber(height * scaleY)
    );

    for (const radiusName of ["rx", "ry"]) {
      const radius = getSvgAttribute(rectTag, radiusName);

      if (radius !== undefined) {
        transformedRect = setSvgAttribute(
          transformedRect,
          radiusName,
          formatSvgNumber(
            parseSvgNumber(radius, radiusName, sourceName, { minimum: 0 }) * scaleY
          )
        );
      }
    }

    transformedRect = scaleRectangleStrokeWidths(
      transformedRect,
      scaleY,
      sourceName
    );

    return transformedRect;
  });

  const svgTag = transformedSvg.match(/<svg\b[^>]*>/i)?.[0];
  let transformedSvgTag = setSvgAttribute(
    svgTag,
    "width",
    formatSvgNumber(geometry.target.width)
  );
  transformedSvgTag = setSvgAttribute(
    transformedSvgTag,
    "height",
    formatSvgNumber(geometry.target.height)
  );
  transformedSvgTag = setSvgAttribute(
    transformedSvgTag,
    "viewBox",
    `0 0 ${formatSvgNumber(geometry.target.width)} ${formatSvgNumber(geometry.target.height)}`
  );
  transformedSvg = transformedSvg.replace(svgTag, transformedSvgTag);

  return { geometry, rectangleCount, svgContent: transformedSvg };
}

async function renderButton({
  outputFile,
  sourceName,
  svgContent,
  targetHeight,
  targetWidth
}) {
  const transformed = transformButtonRectangles({
    sourceName,
    svgContent,
    targetHeight,
    targetWidth
  });

  await sharp(Buffer.from(transformed.svgContent)).png().toFile(outputFile);

  return transformed;
}

function parseViewBox(value, sourceName) {
  if (typeof value !== "string") {
    throw new Error(`Attribut "viewBox" absent dans le bouton SVG : ${sourceName}`);
  }

  const values = value
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (
    values.length !== 4 ||
    values.some((number) => !Number.isFinite(number)) ||
    values[2] <= 0 ||
    values[3] <= 0
  ) {
    throw new Error(
      `Attribut "viewBox" invalide dans le bouton SVG ${sourceName} : "${value}"`
    );
  }

  const [minX, minY, width, height] = values;
  return { minX, minY, width, height };
}

function validateTargetDimension(value, dimensionName, sourceName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Dimension cible "${dimensionName}" invalide pour le bouton ` +
      `${sourceName} : ${value}`
    );
  }

  return value;
}

function readButtonGeometry({
  sourceName = "bouton sans nom",
  svgContent,
  targetHeight,
  targetWidth
}) {
  if (typeof svgContent !== "string" || !svgContent.trim()) {
    throw new Error(`Contenu SVG vide pour le bouton : ${sourceName}`);
  }

  const svgTag = svgContent.match(/<svg\b[^>]*>/i)?.[0];

  if (!svgTag) {
    throw new Error(`Élément <svg> introuvable dans le bouton : ${sourceName}`);
  }

  return {
    source: {
      width: parseSvgLength(getSvgAttribute(svgTag, "width"), "width", sourceName),
      height: parseSvgLength(
        getSvgAttribute(svgTag, "height"),
        "height",
        sourceName
      ),
      viewBox: parseViewBox(getSvgAttribute(svgTag, "viewBox"), sourceName)
    },
    target: {
      width: validateTargetDimension(targetWidth, "width", sourceName),
      height: validateTargetDimension(targetHeight, "height", sourceName)
    }
  };
}

module.exports = {
  formatSvgNumber,
  getSvgAttribute,
  parseSvgNumber,
  parseSvgLength,
  parseViewBox,
  readButtonGeometry,
  renderButton,
  scaleRectangleStrokeWidths,
  setSvgAttribute,
  transformButtonRectangles,
  validateTargetDimension
};
