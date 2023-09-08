const { db } = require('./database');
const { Worker, Queue } = require('bullmq');

const CONNECTION = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
}

const queueNames = {
    LOGGER: 'logger',
    REPORT: 'report',
    GENERATE: 'generate'
}

const myQueue = new Queue(queueNames.LOGGER, {
    connection: CONNECTION
});

const generate = new Queue(queueNames.GENERATE, {
    connection: CONNECTION
});

new Worker(queueNames.LOGGER,
    async job => {
        if (job.name === queueNames.LOGGER) {
            db.execute(`INSERT INTO logs (loger_id, loger_name, message) VALUES (?, ?, ?)`,
                [job.data.generatee_id.toString(), job.data.generatee_name.toString(), job.data.massage.toString()])
        } else if (job.name === queueNames.REPORT) {
            db.execute(`INSERT INTO reports(user_id, file_name) VALUES (?, ?);`,
                [job.data.user_id, job.data.logFileName])
        }
    }, {
    connection: CONNECTION
});

function addToQueue(type, data) {
    myQueue.add(type, data);
}

function addGeneratJob(data) {
    generate.add(data.report_type, data);
}

module.exports = {
    CONNECTION,
    queueNames,
    addToQueue,
    addGeneratJob,
};
