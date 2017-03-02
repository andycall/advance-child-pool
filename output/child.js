let WrappedError = require('error/wrapped');
let childProcessErrorWrapper = new WrappedError({
    message: '{message}',
    type: 'child-process-error',
    stack: null,
    statusCode: null
});
module.exports = function (callback) {
    process.on('message', (msg) => {
        onMessageReceive(msg).then((data) => {
            process.send({
                success: true,
                data: data
            });
        }).catch(err => {
            process.send({
                success: false,
                err: childProcessErrorWrapper(err, {
                    stack: err.stack,
                    message: err.message,
                    statusCode: err.statusCode
                })
            });
        });
    });
    process.on('uncaughtException', function (err) {
        process.send({
            success: false,
            err: err
        }, () => {
            process.exit(1);
        });
    });
    function onMessageReceive(data) {
        return new Promise((resolve, reject) => {
            callback(data, (trigger) => {
                if (trigger instanceof Error) {
                    reject(trigger);
                }
                else {
                    resolve(trigger);
                }
            });
        });
    }
};
