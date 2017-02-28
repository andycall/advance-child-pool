let ProcessManager = require('./child_process');

class ChildProcessManager {
    constructor(options = {}) {
        this.manager = new ProcessManager();
        this.missionCache = [];
        this.maxRunning = options.max || 2;
    }

    clearCache() {
        let runningSize = this.manager.getChildSize();

        if (runningSize <= this.maxRunning && this.missionCache.length > 0) {
            let job = this.missionCache.pop();
            this.runMission(job.path, job.data, job.resolve, job.reject);
        }

        if (this.missionCache.length > 0) {
            setTimeout(() => {
                this.clearCache();
            }, 100);
        }
    }

    runMission(path, data, resolve, reject) {
        let processUid;

        processUid = this.manager.createProcess(path);

        this.manager.sendMessageToChild(processUid, data);

        this.manager.addMessageListerer(processUid, function (result) {
            let isSuccess = result.success;

            // 有错误
            if (!isSuccess) {
                reject(result.err);
            }

            let data = result.data;

            resolve(data);
        });
    }

    sendData(path, data) {
        let self = this;
        return new Promise((resolve, reject) => {
            let runningSize = self.manager.getChildSize();

            if (runningSize > this.maxRunning) {
                self.missionCache.push({
                    path: path,
                    data: data,
                    resolve: resolve,
                    reject: reject
                });

                self.clearCache();
            }
            else {
                this.runMission(path, data, resolve, reject);
            }
        });
    }
}

module.exports = ChildProcessManager;