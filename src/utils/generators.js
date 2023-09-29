const { Worker, } = require('bullmq');
const { CONNECTION, queueNames } = require('./logs');
const { generateMeasurments, generateLogs, generateReport, generateAreas, generateSensorsReport, generateUsersReport, generateMiners, generateAccessPoints } = require('./functions');
const { db } = require('./database');


new Worker(queueNames.GENERATE,
    async job => {
        const { data } = job

        if (job.name === "measurements") {
            generateMeasurments(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "logs") {
            generateLogs(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "reports") {
            generateReport(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "access_points") {
            generateAccessPoints(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "miners") {
            generateMiners(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "users") {
            generateUsersReport(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "sensors") {
            generateSensorsReport(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        } else if (job.name === "areas") {
            generateAreas(data.date_range, data.user_id, { email: data.notifty_email, notify: data.notify_user })
        }
        
    }, {
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

console.log("Workers ready!");