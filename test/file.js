console.log('file child process');

process.on('message', (msg) => {
    setTimeout(() => {
        process.send({
            type: 'file',
            msg: msg
        });
    }, 1000);
});