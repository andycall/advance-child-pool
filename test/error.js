let childTemplate = require('../output/child');

childTemplate((data, done) => {
    let index = data.index;

    if (index % 10 === 0) {
        done(new Error('got Unexpected error!!'));
    }

    done({
        type: 'file',
        msg: data
    });
});