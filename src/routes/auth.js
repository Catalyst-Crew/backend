
const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

//Utils
const sendEmail = require('../utils/email');
const { addLogToQueue } = require('../utils/logs');
const { newToken, getRandomCode } = require('../utils/tokens');
const { db, getNewPassword, redisDb } = require('../utils/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const { validationErrorMiddleware } = require('../utils/middlewares');


//Inti
const router = Router();

const IS_DEV = process.env.IS_DEV === "true";

router.post("/register",
    [
        check("name").escape().notEmpty().withMessage("Invalid name"),
        check("email").escape().isEmail().withMessage("Invalid email"),
        check("user").escape().notEmpty().withMessage("Invalid user"),
        check("role").isNumeric().notEmpty().withMessage("Invalid role").toInt(),
        check("userId").escape().notEmpty().withMessage("Invalid userId").toInt(),
        check("access").isNumeric().notEmpty().withMessage("Invalid access").toInt(),
        check("areaId").isNumeric().notEmpty().withMessage("Invalid areaId").toInt(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { name, email, role, user, access, areaId, userId } = matchedData(req);

        db.execute(`SELECT email FROM users WHERE email = ?;`, [email], async (err, dbResults) => {

            if (err) {
                return res.status(500).json({
                    message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 1
                })
            }

            if (dbResults[0]) {
                return res.status(409).json({ message: "User already exists.", data: { email } })
            }

            const pass = getNewPassword();

            db.execute(`
                    INSERT INTO users 
                    (name, email, password, user_role_id, created_by, updated_by, access_id, area_id)
                    VALUES(?,?,?,?,?,?,?,?);
                `,
                [name, email, hashPassword(pass), role, userId, user, access, areaId],

                expressAsyncHandler(async (err, dbResults) => {
                    if (err) {
                        if (IS_DEV) {
                            console.log("Error creating user: ", err)
                        }
                        return res.status(500).json({ message: "Error creating user." })
                    }

                    sendEmail(email,
                        "You have been granted access",
                        `Your new password is: ${pass}<br/>email: ${email}<br/>
                        User ID: use-${dbResults.insertId}<br/>Area ID: are-${areaId}`, "new-users"
                    )

                    addLogToQueue(dbResults.insertId, user, `User registered successfully by ${user} with email ${email} and role rol-${role} and access acc-${access} and areaId are-${areaId}.`);

                    return res.status(200).json({ message: "User registerd successfully.", data: IS_DEV ? dbResults : {} })

                })
            )
        })
    })
);

router.post("/",
    [
        check("email", "password")
            .notEmpty()
            .withMessage("Please make sure all fields are filled"),
        check("email")
            .escape()
            .isEmail()
            .withMessage("Invalid email")
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { email } = matchedData(req);
        const { password } = req.body;

        db.execute(`
            SELECT 
                CONCAT(id_prefix, id) AS identity, 
                id,
                id_prefix,
                name,
                email,
                password,
                user_role_id,
                phone,
                access_id,
                area_id
            FROM 
                users 
            WHERE 
                email = ?;`,
            [email],
            expressAsyncHandler(async (err, dbResults) => {

                if (err) {
                    return res.status(500).json({
                        message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 1
                    })
                }

                if (!dbResults) {
                    return res.status(404).json({ message: "User not found or incorrect password.", data: { email } })
                }

                if (dbResults[0].access_id === 1_000_001) {
                    return res.status(401).json({ message: "User is disabled." })
                }

                if (dbResults[0].access_id === 1_000_002) {
                    return res.status(401).json({ message: "User not found." })
                }

                //Verify password from db with one from req
                if (verifyPassword(password, dbResults[0].password)) {
                    //Create JWT Token
                    const token = newToken(dbResults[0].id);

                    //Add log to queue
                    addLogToQueue(dbResults[0].id, dbResults[0].name, `User loggedin successfully ${dbResults[0].email}`);

                    return res.status(200).json({ message: "User loggedin successfully.", data: { token, ...dbResults[0], password: "" } })
                }

                res.status(401).json({ message: "Invalid email or password." })
            })
        )
    })
);

router.get("/forgot-password/:email", check("email").escape().isEmail().withMessage("Invalid email"),
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { email } = matchedData(req);

        db.execute(`SELECT email FROM users WHERE email = ?;`, [email], async (err, dbResults) => {

            if (err) {
                return res.status(500).json({
                    message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 1
                })
            }

            if (!dbResults[0]) {
                return res.status(404).json({ message: "User not found with that email.", data: { email } })
            }

            const code = getRandomCode();

            const redisRes = await redisDb.set(email, code, { EX: 600 })

            if (redisRes !== "OK") {
                return res.status(500).json({
                    message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 2
                })
            }

            if (redisRes === "OK") {
                sendEmail(email, "Password reset code", `Your password reset code is: ${code}`)
                return res.status(200).json({ message: "Password reset code sent successfully." })
            }

            res.status(500).json({ message: "Error sending password reset code." })
        })
    })
);

router.patch("/forgot-password/:email/:code",
    [
        check("email").escape().isEmail().withMessage("Invalid email"),
        check("code").escape().notEmpty().withMessage("Invalid code"),
        check("password").escape().notEmpty().withMessage("Invalid password")
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { email, code, password } = matchedData(req);

        const redisRes = await redisDb.get(email);

        if (redisRes === null) {
            return res.status(401).json({ message: "Error occured. Please restart the process." })
        }

        if (redisRes !== code) {
            return res.status(401).json({ message: "Invalid code!" })
        }

        const newPassword = hashPassword(password);

        db.execute(`
                UPDATE users SET
                    password = ?,
                    updated_by = ?
                WHERE 
                    email = ?;`
            ,
            [newPassword, "system", email], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 2 })
                }

                if (dbResults.changedRows > 1) {
                    return res.status(200).json({ message: "Please notify management DB error occured" })
                }

                redisDb.del(email)
                addLogToQueue(email, "User", "Password reset successfully")
                return dbResults.changedRows === 1
                    ?
                    res.status(200).json({ message: "Password reset successfully." })
                    :
                    res.status(500).json({ message: "Error updating password." });
            }
        )
    })
);

module.exports = router;


const express = require('express')
const rateLimit = require('express-rate-limit')
const Redis = require('ioredis')
const login = require('./login')

const app = express()
const redis = new Redis()
// Each IP can only send 5 login requests in 10 minutes
const loginRateLimiter = new rateLimit({ max: 5, windowMS: 1000 * 60 * 10 })

const maxNumberOfFailedLogins = 3;
const timeWindowForFailedLogins = 24 * 60 * 60 //* 1

app.get('api/login', loginRateLimiter, async (req, res) => {
    const { user, password } = req.body
   // check user is not attempted too many login requests
   const userAttempts = await redis.get(user);
   if (userAttempts > maxNumberOfFailedLogins) {
     return res.status(429).send("Too Many Attempts try it one 24 hours later")
   }

   // Let's check user
   const loginResult = await login(user, password)

   // user attempt failed
   if(!loginResult) {
     await redis.set(user, ++userAttempts, 'ex', timeWindowForFailedLogins)
     res.send("failed")
   } else {
    // successful login
    await redis.del(user)
    res.send("success")
   }
})