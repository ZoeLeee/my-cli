import download from 'download-git-repo';
import path from 'path';
import ora from 'ora';

export default function (target) {
  target = path.join(target || '.', '.download-temp');
  return new Promise(function (res, rej) {
    // 这里可以根据具体的模板地址设置下载的url，注意，如果是git，url后面的branch不能忽略
    let url='github:ZoeLeee/BaseLearnCli#bash';
    const spinner = ora(`正在下载项目模板，源地址：${url}`)
    spinner.start();

    download(url, target, { clone: true }, function (err)
    {
        if (err) {
            download(url, target, { clone: false }, function (err)
            {
                if (err) {
                    spinner.fail();
                    rej(err)
                }
                else {
                    // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
                    spinner.succeed()
                    res(target)
                }
            })
        }
        else {
            // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
            spinner.succeed()
            res(target)
        }
    })
  })
}
