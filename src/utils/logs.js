const { db } = require('./database');
const { Worker, Queue } = require('bullmq');

const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');

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

// new Worker(queueNames.LOGGER,
//     async job => {
//         if (job.name === queueNames.LOGGER) {
//             db.execute(`INSERT INTO logs (loger_id, loger_name, message) VALUES (?, ?, ?)`,
//                 [job.data.generatee_id.toString(), job.data.generatee_name.toString(), job.data.massage.toString()])
//         } else if (job.name === queueNames.REPORT) {
//             db.execute(`INSERT INTO reports(user_id, file_name) VALUES (?, ?);`,
//                 [job.data.user_id, job.data.logFileName])
//         }
//     }, {
//     connection: CONNECTION
// });

function addToQueue(type, data) {
    myQueue.add(type, data);
}

function addGeneratJob(data) {
    generate.add(data.report_type, data);
}

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(`/admin/queues/${process.env.QUEUE_PASS}`);

createBullBoard({
    queues: [
        new BullMQAdapter(myQueue),
        new BullMQAdapter(generate)
    ],
    serverAdapter,
    options: {
        uiConfig: {
            boardTitle: 'RescueRadar',
            boardLogo: {
                path: `${process.env.API_HOST}/static/icon.png`,
                width: 80,
                height: 80
            },
            favIcon: {
                default: `${process.env.API_HOST}/static/icon.ico`,
            },
        }
    }
});


module.exports = {
    CONNECTION,
    queueNames,
    addToQueue,
    addGeneratJob,
    serverAdapter
};
