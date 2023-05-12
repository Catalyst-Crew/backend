const mysql = require("mysql2");
const crypto = require("crypto")

//Create database connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    stringifyObjects: true,
    dateStrings: true,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
});


//Funtion returning an id using UUID
const getNewID = (prefix = "") => {
    return prefix + crypto.randomUUID();
}

//Generate a password
const getNewPassword = () => {
    return crypto.randomBytes(8).toString("hex");
}

//Get timestamp for +2 UTC
const getTimestamp = () => {
    const date = new Date();
    const offset = 2 * 60 * 60 * 1000; // UTC+2 offset in milliseconds
    return new Date(date.getTime() + offset);
}

module.exports = { db, getNewID, getNewPassword, getTimestamp }