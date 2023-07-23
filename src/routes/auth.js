
const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

//Utils
const sendEmail = require('../utils/email');
const { newToken } = require('../utils/tokens');
const { hashPassword, verifyPassword } = require('../utils/password');
const { validationErrorMiddleware } = require('../utils/middlewares');
const { db, getNewPassword, getNewID, getTimestamp, redisDb } = require('../utils/database');

//Inti
const router = Router()


router.post("/register",
    [check(["name", "email", "role", "user", "access", "areaId"])
        .notEmpty()
        .escape()
        .withMessage("Please make sure all fields are present"),
    check("email")
        .isEmail()
        .withMessage("Invalid email provided")
    ], validationErrorMiddleware
    , expressAsyncHandler(async (req, res) => {
        const { name, email, role, user, access, areaId } = req.body

        const sqlQuery = `INSERT INTO users (
      id,
      name,
      role,
      email,
      password,
      created_by,
      updated_by,
      last_updated,
      created,
      access,
      areasid
    )
  VALUES
    (
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    );`

        const id = getNewID("USER-");
        const timestamp = getTimestamp();
        const pass = getNewPassword()

        process.env.IS_DEV === "true" && console.log(pass);

        db.execute(sqlQuery, [id, name, role, email, hashPassword(pass), user, user, timestamp, timestamp, access, areaId],
            async (err) => {
                if (err) {
                    return res.status(500).json({ message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 1 });
                }

                sendEmail(email,
                    "You have been granted access",
                    `Your new password is: ${pass}<br/>email: ${email}<br/>User ID:${id}<br/>Area ID: ${areaId}`, "new-users")

                res.status(200).json({ message: "User registerd successfully.", data: {} })
            })
    }))

router.post("/",
    [check("email", "password")
        .notEmpty()
        .withMessage("Please make sure all fields are filled"),
    check("email")
        .escape()
        .isEmail()
        .withMessage("Invalid email")], validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { email, password } = req.body;

        db.execute(`SELECT
        id,
        name,
        role,
        email,
        password,
        created_by,
        updated_by,
        last_updated,
        created,
        access,
        areasid
      FROM
        users WHERE email = ?;`, [email], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 2 })
            }

            if (!dbResults[0]) {
                return res.status(404).json({ message: "User not found.", data: { email } })
            }

            //Verify password from db with one from req
            if (verifyPassword(password, dbResults[0].password)) {
                //Create JWT Token
                const token = newToken(dbResults[0].id)

                //Remove password from the data
                dbResults[0].password = "";
                return res.status(200).json({ message: "User loggedin successfully.", data: { token, ...dbResults[0] } })
            }
            res.status(401).json({ message: "Invalid email or password." })
        })
    })
);

router.get("/forgot-password/:email", check("email").escape().isEmail().withMessage("Invalid email"),
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { email } = req.body;
        redisDb.connect();
        db.execute(`SELECT email FROM users WHERE email = ?;`, [email], (err, dbResults) => {

            if (err) {
                return res.status(500).json({
                    message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? () => {
                        console.log(err);
                        return err;
                    } : 1
                })
            }
            if (!dbResults[0]) {
                return res.status(404).json({ message: "User not found.", data: { email } })
            }

            const code = getRandomCode();

            redisDb.set(email, code, "EX", 600, (err, reply) => {
                if (err) {
                    return res.status(500).json({
                        message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? () => {
                            console.log(err);
                            return
                        } : 2
                    })
                }
                if (reply === "OK") {
                    sendEmail(email, "Password reset code", `Your password reset code is: ${code}`)
                    return res.status(200).json({ message: "Password reset code sent successfully." })
                }
                res.status(500).json({ message: "Error sending password reset code." })
            }
            )
        })
    })
);

router.patch("/forgot-password/:email/:code", [check("email").escape().isEmail().withMessage("Invalid email"),
check("code").escape().notEmpty().withMessage("Invalid code"), check("password").escape().notEmpty().withMessage("Invalid password")],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { email, code, password } = matchedData(req);

        redisDb.get(email, (err, reply) => {
            if (err) {
                return res.status(500).json({
                    message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? () => {
                        console.log(err);
                        return err;
                    } : 1
                })
            }

            if (reply !== code) {
                return res.status(401).json({ message: "Invalid code." })
            }

            db.execute(`
            UPDATE users SET
            password = ?,
            updated_by = ?,
            last_updated = ?
            WHERE email = ?;`,
                [hashPassword(password), "system", getTimestamp(), email], (err, dbResults) => {
                    if (err) {
                        return res.status(500).json({ message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 2 })
                    }

                    if (dbResults.affectedRows > 0) {
                        sendEmail(email, "New password generated", `Your new password is: ${newPassword}`)
                        return res.status(200).json({ message: "Password reset successfully." })
                    }

                    res.status(500).json({ message: "Error updating password." })
                }
            )
        })
    })
);




module.exports = router


