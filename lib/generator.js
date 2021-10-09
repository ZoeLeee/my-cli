import Metalsmith from "metalsmith";
import Handlebars from "handlebars";
import remove from "./remove.js";
import fs from "fs";
import path from "path";
import { Buffer } from "buffer";

export default function (context) {
  let metadata = context.metadata;
  let src = context.downloadTemp;
  let dest = "./" + context.root;
  const useTs = metadata.useTypescript;

  if (!src) {
    return Promise.reject(new Error(`无效的source：${src}`));
  }

  return new Promise((resolve, reject) => {
    const metalsmith = Metalsmith(process.cwd())
      .metadata(metadata)
      .clean(false)
      .source(src)
      .destination(dest);
    // 判断下载的项目模板中是否有templates.ignore
    const ignoreFile = path.resolve(
      process.cwd(),
      path.join(src, "templates.ignore")
    );

    const packjsonTemp = path.resolve(
      process.cwd(),
      path.join(src, "package_temp.json")
    );
    const babelTemp = path.resolve(
      process.cwd(),
      path.join(src, ".babelrc.temp")
    );
    const jsRuleTemp = path.resolve(
      process.cwd(),
      path.join(src, "./config/jsRule.temp")
    );
    const entryTemp = path.resolve(
      process.cwd(),
      path.join(src, "./config/entry.temp")
    );

    let package_temp_content;

    metalsmith.use((files, metalsmith, done) => {
      const meta = metalsmith.metadata();
      package_temp_content = Handlebars.compile(
        fs.readFileSync(packjsonTemp).toString()
      )({ ...meta, fileType: useTs ? "tsx" : "js" });
      done();
    });

    metalsmith.use((files, metalsmith, done) => {
      const meta = metalsmith.metadata();
      Object.keys(files).forEach((fileName) => {
        switch (fileName) {
          case "package.json":
            files[fileName].contents = Buffer.from(package_temp_content);
            break;
          case "config/jsRule.js": {
            if (useTs) {
              const t = files["config/jsRule.temp"].contents.toString();
              files[fileName].contents = Buffer.from(
                Handlebars.compile(t)(meta)
              );
              break;
            }
          }
          case "config/entry.js": {
            if (useTs) {
              const t = files["config/entry.temp"].contents.toString();
              files[fileName].contents = Buffer.from(
                Handlebars.compile(t)(meta)
              );
              break;
            }
          }
          case ".babelrc": {
            if (useTs) {
              const t = files[".babelrc.temp"].contents.toString();
              files[fileName].contents = Buffer.from(
                Handlebars.compile(t)(meta)
              );
              break;
            }
          }
          default: {
            const t = files[fileName].contents.toString();
            files[fileName].contents = Buffer.from(Handlebars.compile(t)(meta));
          }
        }
      });
      done();
    });

    if (fs.existsSync(ignoreFile)) {
      // 定义一个用于移除模板中被忽略文件的metalsmith插件
      metalsmith.use((files, metalsmith, done) => {
        const meta = metalsmith.metadata();
        // 先对ignore文件进行渲染，然后按行切割ignore文件的内容，拿到被忽略清单
        const ignores = Handlebars.compile(
          fs.readFileSync(ignoreFile).toString()
        )(meta)
          .split("\n")
          .map((s) => s.trim())
          .filter((item) => item.length);
        //删除被忽略的文件
        for (let ignorePattern of ignores) {
          if (files.hasOwnProperty(ignorePattern)) {
            delete files[ignorePattern];
          }
        }
        if (useTs) delete files["src/index.js"];
        else {
          delete files["src/index.tsx"];
          delete files["tsconfig.json"];
        }
        done();
      });
    }

    metalsmith.build((err) => {
      remove(src);
      err ? reject(err) : resolve(context);
    });
  });
}
