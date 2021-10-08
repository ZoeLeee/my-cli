// 转换commandJs 2 ESM
import $ from 'gogocode';
import fs from 'fs'

fs.readdir('./lib',(err,files)=>{
    console.log('files: ', files);
    for(const file of files){
        const code=fs.readFileSync("./lib/"+file,{encoding:"utf-8"});
        const AST = $(code);
        AST.replace('const $_$1 = require($_$2);\r\n', 'import $_$1 from $_$2;\r\n');
        fs.writeFileSync('./lib/'+file,AST.generate());
    }
})