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

//Generate timestamp
const CURRENT_TIMESTAMP = { toSqlString: function () { return 'CURRENT_TIMESTAMP()'; } };

//Funtion returning an id using UUID
const getNewID = (prefix="") => {
    return prefix + crypto.randomUUID();
}

const getNewPassword = () => {
    return crypto.randomBytes(8).toString("hex");
}

module.exports = { db, CURRENT_TIMESTAMP, getNewID, getNewPassword }