const { buildTheme } = require("./src/mains.js");

buildTheme({
  themeFolder: process.argv[2],
  frontendName: process.argv[3],
  iconPackFolder: process.argv[4]
}).catch((error) => {
  console.error("\nErreur pendant le build :", error);
  process.exitCode = 1;
});
