let childTemplate = require('../output/child');

childTemplate((data, done) => {
    done({
        type: 'text',
        msg: data.msg,
        index: data.index
    });
});