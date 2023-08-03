const { pDB } = require('./database');
const { Worker, Queue } = require('bullmq');

const CONNECTION = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
}

const worker = new Worker('logger',
    async job => {
        pDB.logs.create({
            data: {
                loger_id: job.data.generatee_id.toString(),
                loger_name: job.data.generatee_name.toString(),
                message: job.data.massage.toString(),
            }
        });
    }, {
    connection: CONNECTION
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
});


const myQueue = new Queue('logger', {
    connection: CONNECTION
});

function addLogToQueue(generatee_id, generatee_name, massage) {
    myQueue.add('log', { generatee_id, generatee_name, massage });
}

module.exports = { worker, addLogToQueue };