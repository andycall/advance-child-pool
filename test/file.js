let childTemplate = require('../output/child');

childTemplate((data, done) => {
    done({
        type: 'file',
        msg: data.msg,
        index: data.index
    })
});