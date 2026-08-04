const fs = require("fs");

function readJson(filePath) {
  const rawContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(rawContent);
}

module.exports = readJson;