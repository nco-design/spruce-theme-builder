const { buildTheme } = require("./src/mains.js");

const flags = process.argv.slice(5);
const supportedFlags = new Set(["--720p"]);
const unsupportedFlag = flags.find((flag) => !supportedFlags.has(flag));

if (unsupportedFlag) {
  console.error(`Option inconnue : ${unsupportedFlag}`);
  process.exitCode = 1;
  return;
}

buildTheme({
  themeFolder: process.argv[2],
  frontendName: process.argv[3],
  iconPackFolder: process.argv[4],
  include720p: flags.includes("--720p")
}).catch((error) => {
  console.error("\nErreur pendant le build :", error);
  process.exitCode = 1;
});
