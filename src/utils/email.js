const nodemailer = require("nodemailer");
const { addToQueue, queueNames } = require("./logs");

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
        transporter.sendMail({
            from: `"Miner Tracker Software"<${emailAlias}@mts.co.za>`,
            to: reciever,
            subject,
            html: massage
        }, (err, info) => {
            if (err) {
                process.env.IS_DEV === "true" && console.log(err);
                return false;
            }

            addToQueue(queueNames.LOGGER, { generatee_id: info.messageId, generatee_name: "Email", massage: `Email sent to ${reciever} with subject ${subject}` })

            return true;
        })

    } catch (error) {
        process.env.IS_DEV === "true" && console.log(error);
        return false
    }
}

module.exports = sendEmail;
