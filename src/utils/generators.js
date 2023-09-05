const { Worker, } = require('bullmq');
const { CONNECTION } = require('./logs');
const { generateMeasurments, generateLogs, generateReport, generateAreas, generateSensorsReport, generateUsersReport, generateMiners, generateAccessPoints } = require('./functions');


new Worker('generate',
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
