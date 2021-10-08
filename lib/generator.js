const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const remove = require("../lib/remove")
const fs = require("fs")
const path = require("path")

module.exports = function (context) {
  let metadata = context.metadata;
  let src = context.downloadTemp;
  let dest = './' + context.root;
  if (!src) {
    return Promise.reject(new Error(`无效的source：${src}`))
  }

  return new Promise((resolve, reject) => {
    const metalsmith = Metalsmith(process.cwd())
      .metadata(metadata)
      .clean(false)
      .source(src)
      .destination(dest);
    // 判断下载的项目模板中是否有templates.ignore
    const ignoreFile = path.resolve(process.cwd(), path.join(src, 'templates.ignore'));

    const packjsonTemp = path.resolve(process.cwd(), path.join(src, 'package_temp.json'));

    let package_temp_content;

    if (fs.existsSync(ignoreFile)) {
      // 定义一个用于移除模板中被忽略文件的metalsmith插件
      metalsmith.use((files, metalsmith, done) => {
        const meta = metalsmith.metadata()
        // 先对ignore文件进行渲染，然后按行切割ignore文件的内容，拿到被忽略清单
        const ignores = Handlebars
          .compile(fs.readFileSync(ignoreFile).toString())(meta)
          .split('\n').map(s => s.trim().replace(/\//g, "\\")).filter(item => item.length);
        //删除被忽略的文件
        for (let ignorePattern of ignores) {
          if (files.hasOwnProperty(ignorePattern)) {
            delete files[ignorePattern];
          }
        }
        done()
      })
    }
    metalsmith.use((files, metalsmith, done) => {
      const meta = metalsmith.metadata();
      package_temp_content = Handlebars.compile(fs.readFileSync(packjsonTemp).toString())(meta);
      done();
    })

    metalsmith.use((files, metalsmith, done) => {
      const meta = metalsmith.metadata()
      Object.keys(files).forEach(fileName => {
        const t = files[fileName].contents.toString()
        if (fileName === "package.json")
          files[fileName].contents = new Buffer(package_temp_content);
        else
          files[fileName].contents = new Buffer(Handlebars.compile(t)(meta));
      })
      done()
    }).build(err => {
      remove(src);
      err ? reject(err) : resolve(context);
    })
  })
}
