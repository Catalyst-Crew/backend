const mysql = require("mysql2");
const crypto = require("crypto");
const { createClient } = require("redis");

//Create database connection
const db = mysql.createPool(process.env.DB_URL);

const CONNECTION = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
}

const redisDb = createClient({
    socket: CONNECTION,
    password: CONNECTION.password,
});

redisDb.on("error", (err) => {
    console.log("RedisDB: ", err);
});

redisDb.on("ready", () => {
    console.log("RedisDB: Ready");
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

module.exports = { db, getNewID, getNewPassword, getTimestamp, redisDb }