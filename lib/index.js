import init from './init.js';
import program from './program.js';

program
  .option("-i, --init <project_name>", "create project")
  .command("init [projectName]")
  .action((projectName, options) => {
	  init(projectName)
  });

program.parse(process.argv);
