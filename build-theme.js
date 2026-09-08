const { buildTheme } = require("./src/mains.js");
const { promptForBuildOptions } = require("./src/interactive-builder.js");
const { readFrontendSettings } = require("./src/load-configs.js");

function parseOptions(args, availableFrontendOptions = []) {
  const options = { frontendOptions: [], paletteName: undefined };
  const frontendOptionNames = new Set(availableFrontendOptions);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--palette") {
      const paletteName = args[index + 1];

      if (!paletteName || paletteName.startsWith("--")) {
        throw new Error('The "--palette" option requires a palette name');
      }

      options.paletteName = paletteName;
      index += 1;
      continue;
    }

    const frontendOptionName = argument.startsWith("--")
      ? argument.slice(2)
      : "";
    if (frontendOptionNames.has(frontendOptionName)) {
      if (!options.frontendOptions.includes(frontendOptionName)) {
        options.frontendOptions.push(frontendOptionName);
      }
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

async function main() {
  if (process.argv.length === 2) {
    await buildTheme(await promptForBuildOptions());
    return;
  }

  const frontendName = process.argv[3];
  if (!process.argv[2] || !frontendName || !process.argv[4]) {
    throw new Error(
      "Usage: node build-theme <theme-name> <frontend> <icon-pack-name> [options]"
    );
  }

  const frontendSettings = readFrontendSettings(frontendName);
  const options = parseOptions(
    process.argv.slice(5),
    Object.keys(frontendSettings.options)
  );

  await buildTheme({
    themeFolder: process.argv[2],
    frontendName,
    iconPackFolder: process.argv[4],
    ...options
  });
}

main().catch((error) => {
  console.error("\nBuild failed:", error);
  process.exitCode = 1;
});

module.exports = { parseOptions };
