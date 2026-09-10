function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceRootAttribute(attributes, name, value) {
  const expression = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*')`, "i");
  const attribute = ` ${name}="${value}"`;
  return expression.test(attributes)
    ? attributes.replace(expression, attribute)
    : `${attributes}${attribute}`;
}

function serializeEmbeddedSvg(svgContent, { height, idPrefix, preserveAspectRatio, width, x, y }) {
  let content = svgContent
    .replace(/^\s*<\?xml[^>]*\?>\s*/i, "")
    .replace(/<!DOCTYPE[^>]*(?:\[[\s\S]*?\]\s*)?>/i, "");

  const ids = [...content.matchAll(/\sid=(['"])([^'"]+)\1/g)]
    .map((match) => match[2]);

  for (const oldId of ids) {
    const newId = `${idPrefix}-${oldId}`;
    const escapedId = escapeRegularExpression(oldId);
    content = content
      .replace(new RegExp(`\\bid=(['"])${escapedId}\\1`, "g"), `id="${newId}"`)
      .replace(new RegExp(`url\\(#${escapedId}\\)`, "g"), `url(#${newId})`)
      .replace(new RegExp(`(["'])#${escapedId}\\1`, "g"), `$1#${newId}$1`);
  }

  const rootMatch = content.match(/<svg\b([^>]*)>/i);
  if (!rootMatch) {
    throw new Error("A preview asset does not contain an SVG root element.");
  }

  let attributes = rootMatch[1];
  attributes = replaceRootAttribute(attributes, "x", x);
  attributes = replaceRootAttribute(attributes, "y", y);
  attributes = replaceRootAttribute(attributes, "width", width);
  attributes = replaceRootAttribute(attributes, "height", height);
  attributes = replaceRootAttribute(attributes, "preserveAspectRatio", preserveAspectRatio);

  return content.replace(rootMatch[0], `<svg${attributes}>`);
}

module.exports = { serializeEmbeddedSvg };
