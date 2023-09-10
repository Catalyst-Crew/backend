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
    console.log("Cron Jobs finished...")
});


//At 05:00 PM, Monday through Saturday
cron.schedule('0 17 * * 1-6', () => {
    console.log("Daily report generating...")
    generateMeasurments([`${getFormattedDate()} 00:00:00`, `${getFormattedDate()} 29:59:59`])
    console.log("Daily report finished...")
});


console.log("Cron Jobs Active")