
const { Router } = require('express')
const expressAsyncHandler = require('express-async-handler')
const { check, validationResult } = require("express-validator")

//Utils
const sendEmail = require('../utils/email')
const { newToken } = require('../utils/tokens')
const { hashPassword, verifyPassword } = require('../utils/password')
const { db, getNewPassword, getNewID, getTimestamp } = require('../utils/database')

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
    ], (req, res, next) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.send({ message: "Missing or invalid fields", data: result.array() });
        }
        next();
    }
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
                    return res.status(500).json({message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 1 });
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
        .withMessage("Invalid email")], (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(401).json({ errors: errors.array() });
            }
            next()
        },
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
                return res.status(500).json({ message: "Can not perform that action right now",error: process.env.IS_DEV === "true" ? err : 2 })
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
    }))

router.post("/reset-password", check("email").escape().isEmail().withMessage("Invalid email"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }

        next()
    },
    expressAsyncHandler(async (req, res) => {
        const { email } = req.body;

        db.execute(`SELECT email FROM users WHERE email = ?;`, [email], (err, dbResults) => {

            if (err) {
                return res.status(500).json({message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 1 })
            }
            if (!dbResults[0]) {
                return res.status(404).json({ message: "User not found.", data: { email } })
            }

            //generate new password and update the user password in database then if sucessfull send the new password to user
            const newPassword = getNewPassword();

            db.execute(`
            UPDATE users SET 
            password = ?, 
            updated_by = ?, 
            last_updated = ?
            WHERE email = ?;`,
                [hashPassword(newPassword), "system", getTimestamp(), email], (err, dbResults) => {
                    if (err) {
                        return res.status(500).json({message: "Can not perform that action right now", error: process.env.IS_DEV === "true" ? err : 2 })
                    }

                    if (dbResults.affectedRows > 0) {
                        sendEmail(email, "New password generated", `Your new password is: ${newPassword}`)
                        return res.status(200).json({ message: "Password reset successfully." })
                    }

                    res.status(500).json({ message: "Error updating password." })
                }
            )

        })
    }))

module.exports = router


