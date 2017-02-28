console.log('text child processs');

process.on('message', (msg) => {
    setTimeout(() => {
        process.send({
            type: 'text',
            msg: msg
        });
    }, 1000);
});