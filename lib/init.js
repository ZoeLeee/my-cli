import program from "commander";
import path from "path";
import fs from "fs-extra";
import glob from "glob";
import download from "./download.js";
import inquirer from "inquirer";
import chalk from "chalk";
import generator from "./generator.js";
import logSymbols from "log-symbols";
import { exec, execSync } from "child_process";
import ora from "ora";

export default async (projectName) => {
  if (!projectName) {
    // project-name 必填
    // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
    program.help();
    return;
  }

  const list = glob.sync("*"); // 遍历当前目录

  let next = undefined;

  let rootName = path.basename(process.cwd());
  if (list.length) {
    // 如果当前目录不为空
    if (
      list.some((n) => {
        const fileName = path.resolve(process.cwd(), n);
        const isDir = fs.statSync(fileName).isDirectory();
        return projectName === n && isDir;
      })
    ) {
      console.log(`项目${projectName}已经存在`);
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "isCover",
          message: "是否覆盖",
        },
      ]);
      if (answer.isCover) {
        //删除存在的目录
        const fileName = path.resolve(process.cwd(), projectName);
        fs.removeSync(fileName);
      } else return;
    }
    rootName = projectName;
    next = Promise.resolve(projectName);
  } else if (rootName === projectName) {
    rootName = ".";
    next = inquirer
      .prompt([
        {
          name: "buildInCurrent",
          message:
            "当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？",
          type: "confirm",
          default: true,
        },
      ])
      .then((answer) => {
        return Promise.resolve(answer.buildInCurrent ? "." : projectName);
      });
  } else {
    rootName = projectName;
    next = Promise.resolve(projectName);
  }

  next && go();

  function go() {
    function exitHandler(options, exitCode) {
      if (options.cleanup){
        console.log(chalk.red("清理数据"));
        execSync(`rm -rf ${projectName}`)
      }
      if (exitCode || exitCode === 0) {
        // console.log(exitCode);
      }
      if (options.exit) process.exit();
    }

    //do something when app is closing
    process.on("exit", exitHandler.bind(null, { cleanup: true }));

    //catches ctrl+c event
    process.on("SIGINT", exitHandler.bind(null, { exit: true }));

    // catches "kill pid" (for example: nodemon restart)
    process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
    process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

    //catches uncaught exceptions
    process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

    next
      .then((projectRoot) => {
        if (projectRoot !== ".") {
          fs.mkdirSync(projectRoot);
        }
        return download(projectRoot).then((target) => {
          return {
            name: projectRoot,
            root: projectRoot,
            downloadTemp: target,
          };
        });
      })
      .then((context) => {
        return inquirer
          .prompt([
            {
              name: "projectName",
              message: "项目的名称",
              default: context.name,
            },
            {
              name: "projectVersion",
              message: "项目的版本号",
              default: "1.0.0",
            },
            {
              name: "projectDescription",
              message: "项目的简介",
              default: `A project named ${context.name}`,
            },
            {
              type: "confirm",
              name: "useTypescript",
              message: "使用Typescript<yse/no>",
              default: "y",
            },
          ])
          .then((answers) => {
            return {
              ...context,
              metadata: {
                ...answers,
              },
            };
          });
      })
      .then((context) => {
        //删除临时文件夹，将文件移动到目标目录下
        return generator(context);
      })
      .then((context) => {
        const spinner = ora(`正在安装依赖`);
        spinner.start();
        return new Promise((resolve, reject) => {
          exec("cd test&&npm install", (err, stdout, stderr) => {
            spinner.succeed();
            if (err) {
              reject(err);
            } else
              resolve({
                context,
                stderr,
                stdout,
              });
          });
        });
      })
      .then(({ context, stderr, stdout }) => {
        console.log(chalk.stderr(stderr));
        console.log(chalk.green(stdout));
        // 成功用绿色显示，给出积极的反馈
        console.log(logSymbols.success, chalk.green("创建成功:)"));
        console.log(chalk.green("cd " + context.root + "\nnpm run dev"));
      })
      .catch((err) => {
        // 失败了用红色，增强提示
        console.log(err);
        console.error(logSymbols.error, chalk.red(`创建失败：${err.message}`));
      });
  }
};
