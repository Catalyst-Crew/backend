const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

//Utils
const keys = require('../utils/keys');
const sendEmail = require('../utils/email');
const { getLineFromError } = require('../utils/functions');
const { addToQueue, queueNames } = require('../utils/logs');
const { newToken, getRandomCode, verifyToken } = require('../utils/tokens');
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
                        return res.status(500).json({ message: "Error creating user." })
                    }

                    sendEmail(email,
                        "You have been granted access",
                        `Your new password is: ${pass}<br/>email: ${email}<br/>
                        User ID: use-${dbResults.insertId}<br/>Area ID: are-${areaId}`, "new-users"
                    )

                    addToQueue(queueNames.LOGGER, { generatee_id: dbResults.insertId, generatee_name: user, massage: `User registered successfully by ${user} with email ${email} and role rol-${role} and access acc-${access} and areaId are-${areaId}.` })

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

        const blocked = await redisDb.get(email);

        if (blocked && blocked === keys.BLOCKED) {
            return res.status(401).json({ message: "User temporaly blocked for 5 minutes", data: { email } })
        }

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

                try {
                    if (!dbResults || dbResults?.length === 0) {
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
                        const token = newToken({ ...dbResults[0], identity: "", password: "" });

                        //Add log to queue
                        addToQueue(queueNames.LOGGER, { generatee_id: dbResults[0].id, generatee_name: "Authentication", massage: `User loggedin successfully ${dbResults[0].email}` })

                        return res.status(200).json({ message: "User logged successfully.", data: { token, ...dbResults[0], password: "" } })
                    }

                    const EXPIRE = 100;
                    const exists = await redisDb.get(email);

                    if (parseInt(exists) < 3) {
                        redisDb.setEx(email, EXPIRE, `${parseInt(exists) + 1}`)
                    }
                    else if (parseInt(exists) === 3) {
                        redisDb.setEx(email, EXPIRE, keys.BLOCKED)
                        return res.status(401).json({ message: "Too many incorrect login attempts. Account blocked for 5 minutes." })
                    }
                    else {
                        redisDb.setEx(email, EXPIRE, "1")
                    }

                    return res.status(401).json({ message: "Invalid email or password." })

                } catch (err) {
                    const at = getLineFromError(err)
                    if (IS_DEV) {
                        console.log(err);
                    }
                    addToQueue(queueNames.LOGGER, { generatee_id: 999_999, generatee_name: "Server | Auth", massage: `${err?.message || " "} ${at}` })
                    return res.status(500).json({ message: "Server error please try again later" })
                }
            })
        )
    })
);

router.get("/forgot-password/:email",
    check("email").escape().isEmail().withMessage("Invalid email"),
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

                redisDb.del(email);

                addToQueue(queueNames.LOGGER, { generatee_id: email, generatee_name: "Authentication", massage: "Password reset successfull" })

                return dbResults.changedRows === 1
                    ?
                    res.status(200).json({ message: "Password reset successfully." })
                    :
                    res.status(500).json({ message: "Error updating password." });
            }
        )
    })
);

router.get("/logout/:token",
    check("token").escape().isString().isJWT().withMessage("Invalid Token supplied"),
    validationErrorMiddleware,
    expressAsyncHandler(
        async (req, res, next) => {
            const { token } = matchedData(req);
            try {
                const data = await redisDb.lPush(keys.INVALID_TOKENS, token);
                if (!data) {
                    next("Failed to invalidate token");
                }

                return next();
            } catch (error) {
                return res.sendStatus(400);
            }
        }
    ), verifyToken,
    expressAsyncHandler((req, res) => {
        try {
            addToQueue(queueNames.LOGGER, { generatee_id: req.userData.email, generatee_name: "Authentication", massage: `User logged out ${JSON.stringify(req.userData)}` })
            return res.sendStatus(401);
        } catch (error) {
            console.log(error);
        }
    })
)

module.exports = router;