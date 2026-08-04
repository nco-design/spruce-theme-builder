const { buildProject } = require("./src/build-icons.js");

buildProject({
  projectType: "theme",
  projectFolder: process.argv[2]
}).catch((error) => {
  console.error("\nErreur pendant le build :", error);
  process.exitCode = 1;
});
