const cron = require('node-cron');
const {
    generateAccessPoints,
    generateAreas,
    generateLogs,
    generateMeasurments,
    generateMiners,
    generateReport,
    generateSensorsReport,
    generateUsersReport
} = require('./functions');

function getFormattedDate() {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDate30DaysFromNow() {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}

//Cron jobs to run every 15 minutes on the 1st of each and every month

//2:00
cron.schedule('0 2 1 * *', () => {
    console.log("Cron Jobs started...")
    generateAccessPoints([getFormattedDate(), getDate30DaysFromNow()])
});

//2:15
cron.schedule('15 2 1 * *', () => {
    generateAreas([getFormattedDate(), getDate30DaysFromNow()])
});

//2:30
cron.schedule('30 2 1 * *', () => {
    generateLogs([getFormattedDate(), getDate30DaysFromNow()])
});

//2:45
cron.schedule('45 2 1 * *', () => {
    generateMeasurments([getFormattedDate(), getDate30DaysFromNow()])
});

//3:00
cron.schedule('0 3 1 * *', () => {
    generateMiners([getFormattedDate(), getDate30DaysFromNow()])
});

//3:15
cron.schedule('15 3 1 * *', () => {
    generateReport([getFormattedDate(), getDate30DaysFromNow()])
});

//3:30
cron.schedule('30 3 1 * *', () => {
    generateSensorsReport([getFormattedDate(), getDate30DaysFromNow()])
});

//3:45
cron.schedule('45 3 1 * *', () => {
    generateUsersReport([getFormattedDate(), getDate30DaysFromNow()])
});
