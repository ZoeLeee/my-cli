const program = require('commander')
const path = require('path')
const fs = require('fs')
const glob = require('glob') // npm i glob -D
const download = require('../lib/download.js')
const inquirer = require('inquirer')
const chalk = require('chalk')
const generator = require('../lib/generator')
const logSymbols = require("log-symbols");
const remove = require('../lib/remove')

  
  program.usage('<project-name>')

// 根据输入，获取项目名称
let projectName = process.argv[2];

if (!projectName) {  // project-name 必填
  // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
  program.help()
  return
}

const list = glob.sync('*')  // 遍历当前目录

let next = undefined;

let rootName = path.basename(process.cwd());
if (list.length) {  // 如果当前目录不为空
  if (list.some(n => {
    const fileName = path.resolve(process.cwd(), n);
    const isDir = fs.statSync(fileName).isDirectory();
    return projectName === n && isDir
  })) {
    console.log(`项目${projectName}已经存在`);
    return;
  }
  rootName = projectName;
  next = Promise.resolve(projectName);
} else if (rootName === projectName) {
  rootName = '.';
  next = inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
      type: 'confirm',
      default: true
    }
  ]).then(answer => {
    return Promise.resolve(answer.buildInCurrent ? '.' : projectName)
  })
} else {
  rootName = projectName;
  next = Promise.resolve(projectName)
}

next && go()

function go() {
  next
    .then(projectRoot => {
      if (projectRoot !== '.') {
        fs.mkdirSync(projectRoot)
      }
      return download(projectRoot).then(target => {
        return {
          name: projectRoot,
          root: projectRoot,
          downloadTemp: target
        }
      })
    })
    .then(context => {
      return inquirer.prompt([
        {
          name: 'projectName',
          message: '项目的名称',
          default: context.name
        }, {
          name: 'projectVersion',
          message: '项目的版本号',
          default: '1.0.0'
        }, {
          name: 'projectDescription',
          message: '项目的简介',
          default: `A project named ${context.name}`
        }
      ]).then(answers => {
        return {
          ...context,
          metadata: {
            ...answers
          }
        }
      })
    })
    .then(context => {
      //删除临时文件夹，将文件移动到目标目录下
      return generator(context);
    })
    .then(context => {
      // 成功用绿色显示，给出积极的反馈
      console.log(logSymbols.success, chalk.green('创建成功:)'))
      console.log(chalk.green('cd ' + context.root + '\nnpm install\nnpm run dev'))
    })
    .catch(err => {
      // 失败了用红色，增强提示
      console.log(err);
      console.error(logSymbols.error, chalk.red(`创建失败：${err.message}`))
    })
}