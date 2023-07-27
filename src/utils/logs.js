const { Worker, Queue } = require('bullmq');
const { db, getNewID, getTimestamp } = require('./database');

const CONNECTION = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
}

const worker = new Worker('logger',
    async job => {
        db.execute(`
        INSERT INTO logs
        (
            id, 
            generatee_id, 
            generatee_name, 
            timestamp, 
            massage
        ) 
        VALUES 
        (
            ?, 
            ?, 
            ?, 
            ?, 
            ?
        );`,
            [getNewID("LOG-"), job.data.generatee_id, job.data.generatee_name, getTimestamp(), job.data.massage],
            (err) => {
                if (err) return process.env.IS_DEV === "true" ? console.log(err) : "Logging failed due to database error";
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