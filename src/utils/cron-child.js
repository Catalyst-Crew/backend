const cron = require('node-cron');

cron.schedule('* * * * *', () => {
    console.log('Cron job is running...');
    // Put your cron job logic here
});
