const keys = require('./keys');
const cron = require('node-cron');
const {
    generateAccessPoints,
    generateAreas,
    generateLogs,
    generateMeasurments,
    generateMiners,
    generateReport,
    generateSensorsReport,
    generateUsersReport,
    getDaysFromNow
} = require('./functions');
const { redisDb } = require('./database');

function getFormattedDate() {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


//Cron jobs to run every 15 minutes on the 1st of each and every month

//2:00
cron.schedule('0 2 1 * *', () => {
    console.log("Cron Jobs started...")
    generateAccessPoints([getFormattedDate(), getDaysFromNow(30)])
});

//2:15
cron.schedule('15 2 1 * *', () => {
    generateAreas([getFormattedDate(), getDaysFromNow(30)])
});

//2:30
cron.schedule('30 2 1 * *', () => {
    generateLogs([getFormattedDate(), getDaysFromNow(30)])
});

//2:45
cron.schedule('45 2 1 * *', () => {
    generateMeasurments([getFormattedDate(), getDaysFromNow(30)])
});

//3:00
cron.schedule('0 3 1 * *', () => {
    generateMiners([getFormattedDate(), getDaysFromNow(30)])
});

//3:15
cron.schedule('15 3 1 * *', () => {
    generateReport([getFormattedDate(), getDaysFromNow(30)])
});

//3:30
cron.schedule('30 3 1 * *', () => {
    generateSensorsReport([getFormattedDate(), getDaysFromNow(30)])
});

//3:45
cron.schedule('45 3 1 * *', () => {
    generateUsersReport([getFormattedDate(), getDaysFromNow(30)])
});


//At 05:00 PM, Monday through Saturday
cron.schedule('0 17 * * 1-6', () => {
    generateMeasurments([`${getFormattedDate()} 00:00:00`, `${getFormattedDate()} 29:59:59`])
});

// 12:00 AM Everyday
cron.schedule('0 0 * * * ', () => {
    try {
        redisDb.lTrim(keys.INVALID_TOKENS, 0, 0)
    } catch (e) {
        console.log("Failed to run cron to clear invalid tokens: ", e);
    }
});


console.log("Cron Jobs Active!")