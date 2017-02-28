let childTemplate = require('../output/child');

childTemplate((data, done) => {
    setTimeout(() => {
        done({
            type: 'text',
            msg: data.msg,
            index: data.index
        });
    }, 1);
});