let childTemplate = require('../src/child');

childTemplate((data, done) => {
    done({
        type: 'file',
        msg: data.msg,
        index: data.index
    })
});