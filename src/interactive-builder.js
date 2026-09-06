const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const { ROOT_DIR } = require("./paths.js");

function listDirectories(directoryPath) {
  return fs.readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));
}

function listPaletteNames(themeFolder) {
  const palettesDir = path.join(
    ROOT_DIR,
    "projects",
    "themes",
    themeFolder,
    "palettes"
  );

  return fs.readdirSync(palettesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name) === ".json")
    .map((entry) => path.basename(entry.name, ".json"))
    .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));
}

async function chooseFromMenu(prompt, choices, interface_) {
  if (choices.length === 0) {
    throw new Error(`No choices available for: ${prompt}`);
  }

  while (true) {
    console.log(`\n${prompt}`);
    choices.forEach((choice, index) => console.log(`  ${index + 1}. ${choice.label}`));

    const answer = (await interface_.question("Choice: ")).trim();
    const choiceIndex = Number(answer) - 1;

    if (Number.isInteger(choiceIndex) && choices[choiceIndex]) {
      return choices[choiceIndex].value;
    }

    console.log(`Please enter a number from 1 to ${choices.length}.`);
  }
}

async function confirm(prompt, interface_, defaultValue = false) {
  const suffix = defaultValue ? "[Y/n]" : "[y/N]";

  while (true) {
    const answer = (await interface_.question(`\n${prompt} ${suffix} `))
      .trim()
      .toLowerCase();

    if (!answer) {
      return defaultValue;
    }
    if (["y", "yes"].includes(answer)) {
      return true;
    }
    if (["n", "no"].includes(answer)) {
      return false;
    }

    console.log("Please answer y or n.");
  }
}

async function promptForBuildOptions({ input = stdin, output = stdout } = {}) {
  const interface_ = readline.createInterface({ input, output });

  try {
    console.log("\nSpruce Theme Builder\n");

    const themeFolder = await chooseFromMenu(
      "Choose a theme:",
      listDirectories(path.join(ROOT_DIR, "projects", "themes"))
        .map((name) => ({ label: name, value: name })),
      interface_
    );

    const frontendName = await chooseFromMenu(
      "Choose a frontend:",
      listDirectories(path.join(ROOT_DIR, "frontends"))
        .map((name) => ({ label: name, value: name })),
      interface_
    );

    const paletteName = await chooseFromMenu(
      "Choose a palette:",
      [
        { label: "All palettes", value: undefined },
        ...listPaletteNames(themeFolder)
          .map((name) => ({ label: name, value: name }))
      ],
      interface_
    );

    const iconPackFolder = await chooseFromMenu(
      "Choose an icon pack:",
      listDirectories(path.join(ROOT_DIR, "projects", "icon-packs"))
        .map((name) => ({ label: name, value: name })),
      interface_
    );

    const include720p = await confirm("Include optional 720p assets?", interface_);

    return {
      frontendName,
      iconPackFolder,
      include720p,
      paletteName,
      themeFolder
    };
  } finally {
    interface_.close();
  }
}

module.exports = {
  chooseFromMenu,
  confirm,
  listDirectories,
  listPaletteNames,
  promptForBuildOptions
};
