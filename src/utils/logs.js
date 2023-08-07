const { db } = require('./database');
const { Worker, Queue } = require('bullmq');


const CONNECTION = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
}


const worker = new Worker('logger',
    async job => {
        db.execute(`INSERT INTO logs (loger_id, loger_name, message) VALUES (?, ?, ?)`,
            [job.data.generatee_id.toString(), job.data.generatee_name.toString(), job.data.massage.toString()])
    }, {
    connection: CONNECTION
});


const myQueue = new Queue('logger', {
    connection: CONNECTION
});


function addLogToQueue(generatee_id, generatee_name, massage) {
    myQueue.add('log', { generatee_id, generatee_name, massage });
}


module.exports = { worker, addLogToQueue };