const { buildTheme } = require("./src/mains.js");

function parseOptions(args) {
  const options = { include720p: false, paletteName: undefined };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--720p") {
      options.include720p = true;
      continue;
    }

    if (argument === "--palette") {
      const paletteName = args[index + 1];

      if (!paletteName || paletteName.startsWith("--")) {
        throw new Error('L\'option "--palette" nécessite un nom de palette');
      }

      options.paletteName = paletteName;
      index += 1;
      continue;
    }

    throw new Error(`Option inconnue : ${argument}`);
  }

  return options;
}

async function main() {
  const options = parseOptions(process.argv.slice(5));

  await buildTheme({
    themeFolder: process.argv[2],
    frontendName: process.argv[3],
    iconPackFolder: process.argv[4],
    ...options
  });
}

main().catch((error) => {
  console.error("\nErreur pendant le build :", error);
  process.exitCode = 1;
});

module.exports = { parseOptions };
