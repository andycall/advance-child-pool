child-process-manager
========================
Advance Node.js child process pool, support multitype child process, error handing。

support features:
+ child process pool manage
+ recover dead child process
+ message queue
+ muilti task config

## Setup

### Config Master Process
```javascript
let childProcess = require('child-process-manager').childManager;

const textFilePath = path.join(__dirname, 'text.js');
const fileFilePath = path.join(__dirname, 'file.js');
const errorFilePath = path.join(__dirname, 'error.js');

// register child process
childProcess.registerTask('text', textFilePath);
childProcess.registerTask('file', fileFilePath);
childProcess.registerTask('error', errorFilePath);

// start pool
childProcess.childStartUp();

// send data to child
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

### Config Child
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

## Test
run test
```javascript
npm test
```