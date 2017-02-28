let ChildProcessManager = require('../output/index');
let childProcess = require('../output/child_process');
let path = require('path');
let assert = require('assert');
let exec = require('child_process').execSync;

const textFilePath = path.join(__dirname, 'text.js');
const fileFilePath = path.join(__dirname, 'file.js');

childProcess.registerTask('text', textFilePath);
childProcess.registerTask('file', fileFilePath);

childProcess.childStartUp();

for (let i = 0; i < 6; i++) {
    let job = childProcess.createJob('text');

    childProcess.addMessageListener(job, (msg) => {
        console.log('the index of job\'s msg:', msg);
        childProcess.detach(job);
    });

    childProcess.sendMessageToChild(job, {
        data: `hello index:${i}`
    });
}

// console.log(childProcess);

// describe('Child Process Manager Test', () => {
//     function createChildProcess(type, msg) {
//         return new Promise((resolve, reject) => {
//             let childInstanceId = childProcess.createJob(type);
//             childProcess.addMessageListener(childInstanceId, (_msg) => {
//                 assert.deepEqual(_msg, {
//                     type: type,
//                     msg: msg
//                 });

//                 resolve(_msg);
//             });

//             childProcess.sendMessageToChild(childInstanceId, msg);
//         });
//     }

//     it('child process test', (done) => {
//         let childPromise = createChildProcess(childProcess, {
//             msg: 'helloworld'
//         }).then(() => {
//             done();
//         }).catch(err => {
//             done(err);
//         });
//     });

//     // it('10 child process test', (done) => {
//     //     let childArr = [];

//     //     for (let i = 0; i < 10; i++) {
//     //         let childPromise = createChildProcess(childProcess, {
//     //             msg: 'helloworld'
//     //         });
//     //         childArr.push(childPromise);
//     //     }

//     //     Promise.all(childArr).then(() => {
//     //         done();
//     //     }).catch(err => {
//     //         done(err);
//     //     })
//     // });

//     // it('refer missing test', (done) => {
//     //     let childArr = [];

//     //     for (let i = 0; i < 10; i++) {
//     //         let child = createChildProcess(childProcess, {
//     //             msg: 'helloworld'
//     //         });

//     //         childArr.push(child);
//     //     }

//     //     let another = createChildProcess(childProcess, {
//     //         msg: 'helloworld'
//     //     });

//     //     childArr.push(another);

//     //     Promise.all(childArr).then(() => {
//     //         let managerSize = childProcess._getChildSize();
//     //         let readySize = exec(`ps -ef | grep 'child.js'`);

//     //         console.log(managerSize, readySize.toString());
//     //         done();
//     //     }).catch(err => {
//     //         done(err);
//     //     });
//     // });
// });