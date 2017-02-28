child-process-manager
========================

全功能Node.js子进程管理器

支持以下强大的功能：

+ 进程池管理
+ 死进程复活
+ 消息队列
+ 多任务配置

## Setup

主进程配置
```javascript
let childProcess = require('child-process-manager').childManager;

const textFilePath = path.join(__dirname, 'text.js');
const fileFilePath = path.join(__dirname, 'file.js');
const errorFilePath = path.join(__dirname, 'error.js');

// 注册任务
childProcess.registerTask('text', textFilePath);
childProcess.registerTask('file', fileFilePath);
childProcess.registerTask('error', errorFilePath);

// 启动子进程
childProcess.childStartUp();

childProcess.sendData('text', {
    data: 'helloworld'
}).then((res) => {
    // response from child_process
    console.log(res);
}).catch(err => {
    // error from child_process
    console.log(err);
});
```

子进程配置
```javascript
let childTemplate = require('child-process-manager').childWorker;

childTemplate((data, done) => {
    done({
        type: 'file',
        msg: data.msg,
        index: data.index
    })
});
```