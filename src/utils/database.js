const mysql = require("mysql2");
const crypto = require("crypto")

//Create database connection
const db = mysql.createPool(process.env.DB_URL);


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