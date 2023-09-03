const { db } = require('./database');
const { Worker, Queue } = require('bullmq');


const CONNECTION = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
}

new Worker('logger',
    async job => {
        db.execute(`INSERT INTO logs (loger_id, loger_name, message) VALUES (?, ?, ?)`,
            [job.data.generatee_id.toString(), job.data.generatee_name.toString(), job.data.massage.toString()])
    }, {
    connection: CONNECTION
});
new Worker('logger',
    async (job) => {
        db.execute(`INSERT INTO logs (loger_id, loger_name, message) VALUES (?, ?, ?)`,
            [job.data.generatee_id.toString(), job.data.generatee_name.toString(), job.data.massage.toString()])
    }, {
    connection: CONNECTION
});
new Worker('report',
    async (job) => {
        db.execute(`INSERT INTO reports(user_id, file_name) VALUES (?, ?);`,
            [job.data.id, job.data.file_name])
    }, {
    connection: CONNECTION
});


const myQueue = new Queue('logger', {
    connection: CONNECTION
});
const report = new Queue('report', {
    connection: CONNECTION
});


function addLogToQueue(generatee_id, generatee_name, massage) {
    myQueue.add('log', { generatee_id, generatee_name, massage });
}

function addReportToQueue(id = 999_999, file_name) {
    report.add('report', { id, file_name });
}

//Add do retry queue

//Add to error queue (generate notification)

module.exports = { addLogToQueue, addReportToQueue };