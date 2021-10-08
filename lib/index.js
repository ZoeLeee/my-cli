const program = require("commander");
const init=require("./init.js")

program.version("1.0.0");

program
  .option("-i, --init <project_name>", "create project")
  .command("init [projectName]")
  .action((projectName, options) => {
	  init(projectName)
  });

program.parse(process.argv);
