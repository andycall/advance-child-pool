let childProcess = require('../output/child_manager');
let path = require('path');
let assert = require('assert');

const textFilePath = path.join(__dirname, 'text.js');
const fileFilePath = path.join(__dirname, 'file.js');
const errorFilePath = path.join(__dirname, 'error.js');
describe('Child Process Manager Test', () => {
    before(() => {
        childProcess.registerTask('text', textFilePath);
        childProcess.registerTask('file', fileFilePath);
        childProcess.registerTask('error', errorFilePath);
        childProcess.childStartUp();
    });

    it('create Text Job', (done) => {
        let data = {
            msg: 'helloworld'
        };

        childProcess.sendData('text', data).then((res) => {
            assert.equal(res.type, 'text');
            assert.equal(res.msg, 'helloworld');

            done();
        }).catch(err => {
            done(err);
        })
    });

    it('create Many Job', done => {
        let data = {
            msg: 'helloworld'
        };

        let childArr = [];

        for (let i = 0; i < 100; i ++) {
            data.index = i;
            let promise = childProcess.sendData('text', Object.assign({}, data));
            childArr.push(promise)
        }

        Promise.all(childArr).then(result => {
            result.forEach((item, index) => {
                assert.equal(item.type, 'text');
                assert.equal(item.msg, 'helloworld');
                assert.equal(item.index, index);
            });
            done();
        }).catch(err => {
            done(err);
        })
    });

    it('create multi many job', done => {
        let textData = {
            msg: 'Hello Text'
        };

        let fileData = {
            msg: 'Hello File'
        };

        let childArr = [];

        for (let i = 0; i < 500; i ++) {
            textData.index = i;
            fileData.index = i;
            let textPromise = childProcess.sendData('text', Object.assign({}, textData));
            let filePromise = childProcess.sendData('file', Object.assign({}, fileData));
            childArr.push(textPromise);
            childArr.push(filePromise);
        }

        Promise.all(childArr).then((result) => {
            result.forEach((item, index) => {
                if (index % 2 === 0) {
                    assert.equal(item.type, 'text');
                    assert.equal(item.msg, 'Hello Text');
                    assert.equal(item.index, index / 2);
                }
                else {
                    assert.equal(item.type, 'file');
                    assert.equal(item.msg, 'Hello File');
                    assert.equal(item.index, Math.floor(index / 2));
                }
            });

            done();
        }).catch(err => {
            done(err);
        })
    });

    it('running error task', (done) => {
        let childArr = [];

        for (let i = 0; i < 100; i ++) {
            let errorData = {
                msg: 'error!!',
                index: i
            };

            let errorPromise = childProcess.sendData('error', errorData);

            childArr.push(errorPromise);
        }

        Promise.all(childArr).then((result) => {
            console.log('1', result);
        }).catch(err => {
            assert.equal(err.message, 'got Unexpected error!!');

            done();
        });
    });
});