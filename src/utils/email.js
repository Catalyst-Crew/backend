const nodemailer = require("nodemailer");

async function sendEmail(reciever = "", subject = "New massage", massage = "", emailAlias = "no-reply") {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: `"Miner Tracker Software"<${emailAlias}@mts.co.za>`,
            to: reciever,
            subject,
            html: massage
        });
        return true
    } catch (error) {
        process.env.IS_DEV === "true" && console.log(error);
        return false
    }
}

module.exports = sendEmail;
