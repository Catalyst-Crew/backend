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

        await pDB.logs.create({
            data: {
                loger_id: job.data.generatee_id,
                loger_name: job.data.generatee_name,
                message: job.data.massage,
            }
        })
    }, {
    connection: CONNECTION
});

const myQueue = new Queue('logger', {
    connection: CONNECTION
});

async function addLogToQueue(generatee_id, generatee_name, massage) {
    myQueue.add('log', { generatee_id, generatee_name, massage });
}

//Example of how you use the logger 
//addLogToQueue("TEST-123456789", "Test", "This is a test massage")

module.exports = { worker, addLogToQueue };