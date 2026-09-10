const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");

async function chooseTheme(themes) {
  const terminal = readline.createInterface({ input, output });

  console.log("\nAvailable themes:\n");
  themes.forEach((theme, index) => {
    const displayName = theme.name === theme.folder
      ? theme.name
      : `${theme.name} (${theme.folder})`;
    console.log(`${index + 1}. ${displayName}`);
  });
  console.log("\n0. Cancel");

  try {
    const answer = (await terminal.question("\nChoose a theme: ")).trim();
    if (answer === "0" || answer.toLowerCase() === "q") return null;

    const selectedIndex = Number(answer) - 1;
    if (!Number.isInteger(selectedIndex) || !themes[selectedIndex]) {
      throw new Error("Choose a theme from the list.");
    }

    return themes[selectedIndex];
  } finally {
    terminal.close();
  }
}

module.exports = { chooseTheme };
