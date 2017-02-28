/**
 * 子node进程管理器
 */
let fork = require('child_process').fork;
let path = require('path');
let _ = require('lodash');
let uuid = require('node-uuid');
let os = require('os');
class ProcessManager {
    constructor(poolSize) {
        // 进程池Hash
        this.childMap = new Map();
        // 任务池Hasp
        this.taskMap = new Map();
        // pid池Hash
        this.idMap = new Map();
        this.poolSize = poolSize || 4;
        this.runningCount = {};
        this._childCount = 0;
        this.jobQuene = {};
        this.maxErrorCount = poolSize * 10;
        this.errCount = 0;
    }
    _getChildSize() {
        return this.childMap.size;
    }
    registerTask(task, entryPath) {
        if (this.taskMap.size > this.poolSize) {
            throw new Error('任务量不能超过进程池的数量');
        }
        this.taskMap.set(task, entryPath);
    }
    handleTooMuchError(callback) { }
    kill() {
        for (let taskType of this.taskMap.keys()) {
            let taskPool = this.childMap.get(taskType);
            taskPool.forEach(info => {
                let instance = info.childInstance;
                instance.kill();
            });
        }
    }
    /**
     * 正确应对进程异常退出
     */
    handleChildExit(taskType, entry, childInstance, code, signal) {
        let childPool = this.childMap.get(taskType);
        setTimeout(() => {
            this.maxErrorCount = this.poolSize * 10;
        }, 5000);
        childPool.forEach(info => {
            if (info.childInstance === childInstance) {
                let newInstance = fork(entry);
                newInstance.on('close', this.handleChildExit.bind(this, taskType, entry, newInstance));
                info.childInstance = newInstance;
                this.errCount++;
                // 过多错误直接报警
                if (this.errCount > this.maxErrorCount) {
                    console.log('too many error!!');
                    this.handleTooMuchError(this.errCount);
                    return;
                }
                // 恢复任务
                let taskId = info.id;
                let idInfo = this.idMap.get(taskId);
                if (idInfo) {
                    // 给进程分配新的任务
                    idInfo.childInstance = newInstance;
                    this.idMap.set(taskId, idInfo);
                    this.addMessageListener(taskId, idInfo.messageCallback);
                    this.sendMessageToChild(taskId, idInfo.data);
                }
            }
        });
    }
    /**
     * 根据task数和poolSize预先分配子进程
     */
    childStartUp() {
        let taskCount = Math.floor(this.poolSize / this.taskMap.size);
        let taskKeys = this.taskMap.keys();
        for (let taskType of taskKeys) {
            for (let i = 0; i < taskCount; i++) {
                let entry = this.taskMap.get(taskType);
                if (this._childCount >= this.poolSize) {
                    return;
                }
                this._childCount++;
                let child = fork(entry);
                child.on('close', this.handleChildExit.bind(this, taskType, entry, child));
                let childTaskInfo;
                if (!this.childMap.has(taskType)) {
                    childTaskInfo = [];
                }
                else {
                    childTaskInfo = this.childMap.get(taskType);
                }
                childTaskInfo.push({
                    taskType: taskType,
                    childInstance: child,
                    available: true
                });
                this.childMap.set(taskType, childTaskInfo);
            }
            this.runningCount[taskType] = 0;
            this.jobQuene[taskType] = [];
        }
    }
    /**
     * 在不退出进程的情况下回收进程
     * @param id
     */
    detach(id) {
        if (!this.idMap.has(id)) {
            throw new Error('未知的process Id');
        }
        let idInfo = this.idMap.get(id);
        let taskType = idInfo.type;
        let childInstance = idInfo.childInstance;
        this.runningCount[taskType]--;
        let childMapInfo = this.childMap.get(taskType);
        let targetChildInfo = null;
        childMapInfo.forEach(_info => {
            if (_info.id === id) {
                // 回收进程，设为可用状态
                _info.id = null;
                _info.available = true;
                targetChildInfo = _info;
            }
        });
        // 消除旧的进程
        this.idMap.delete(id);
        if (this.jobQuene[taskType].length > 0) {
            let newTask = this.jobQuene[taskType].shift();
            let newTaskId = newTask.id;
            targetChildInfo.id = newTaskId;
            let idInfo = this.idMap.get(newTaskId);
            // 给进程分配新的任务
            idInfo.childInstance = childInstance;
            this.idMap.set(newTaskId, idInfo);
            this.runningCount[taskType]++;
            this.addMessageListener(newTaskId, idInfo.messageCallback);
            this.sendMessageToChild(newTaskId, idInfo.data);
        }
        // 回收变量
        targetChildInfo = null;
        childMapInfo = null;
    }
    /**
     * 创建一个任务，用于发送给进程
     * @param type
     * @returns {*}
     */
    createJob(type) {
        if (this._childCount === 0) {
            throw new Error('请预分配进程到进程池');
        }
        if (!this.taskMap.has(type)) {
            throw new Error('未知的任务类型');
        }
        let id = uuid.v1();
        let taskCount = Math.floor(this.poolSize / this.taskMap.size);
        // 队列满了，等待
        if (this.runningCount[type] >= taskCount) {
            this.jobQuene[type].push({
                id: id
            });
            this.idMap.set(id, {
                messageCallback: null,
                childInstance: null,
                data: null,
                type: type
            });
            return id;
        }
        this.runningCount[type]++;
        let taskChildArr = this.childMap.get(type);
        let readyChildInstance;
        taskChildArr.forEach(info => {
            if (info.available && !readyChildInstance) {
                readyChildInstance = info.childInstance;
                info.available = false;
                info.id = id;
                this.idMap.set(id, {
                    messageCallback: null,
                    childInstance: readyChildInstance,
                    type: type,
                    data: null
                });
            }
        });
        if (!readyChildInstance) {
            throw new Error('没有可用的进程分配');
        }
        readyChildInstance = null;
        return id;
    }
    // 添加消息回调
    addMessageListener(id, callback) {
        if (!this.idMap.has(id)) {
            throw new Error('未知的process Id');
        }
        let idInfo = this.idMap.get(id);
        let childInstance = idInfo.childInstance;
        if (!childInstance) {
            idInfo.messageCallback = callback;
            return;
        }
        childInstance.once('message', (msg) => {
            callback(msg);
        });
    }
    // 向进程发送数据
    sendMessageToChild(id, message) {
        if (!this.idMap.has(id)) {
            throw new Error('未知的process Id');
        }
        let idInfo = this.idMap.get(id);
        let childInstance = idInfo.childInstance;
        if (!childInstance) {
            idInfo.data = message;
            return;
        }
        childInstance.send(message);
    }
    // 封装更彻底的接口，调用数据直接返回Promise
    sendData(type, data) {
        return new Promise((resolve, reject) => {
            let job = this.createJob(type);
            this.addMessageListener(job, (msg) => {
                this.detach(job);
                if (msg.success) {
                    resolve(msg.data);
                }
                else {
                    reject(msg.err);
                }
            });
            this.sendMessageToChild(job, data);
        });
    }
}
const manager = new ProcessManager();
process.on('exit', function () {
    console.log('killing..');
    manager.kill();
    process.exit(0);
});
process.on('SIGINT', function () {
    console.log('Ctrl-C');
    manager.kill();
    process.exit(0);
});
module.exports = manager;
