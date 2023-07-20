const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { validationErrorMiddleware } = require('../utils/middlewares');

const ENV = process.env.IS_DEV === "true";

const router = Router();


router.use(expressAsyncHandler(async (req, res, next) => {
    if (!ENV) {
        verifyToken(req, res, next); //uncomment in production
    }

    if (ENV) {
        next() //Remove this on production
    }
}));

router.get('/:usersid',
    check("usersid", "usersid is required").escape().notEmpty(),
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { usersid } = matchedData(req);

        const sqlQuery = `
            SELECT
                usersid,
                appNotifications,
                emailNotifications,
                darkMode
            FROM
                settings
            WHERE
                usersid=?
            LIMIT 1
        `;

        db.execute(sqlQuery, [usersid], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            res.status(200).json(dbResults[0])
        })
    })
);

router.put('/:usersid',
    [
        check("usersid", "usersid is required").escape().notEmpty().isString(),
        check("app", "appNotification is required").escape().notEmpty().isNumeric(),
        check("email", "emailNotification is required").escape().notEmpty().isNumeric(),
        check("darkMode", "darkMode is required").escape().notEmpty().isNumeric()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { usersid, app, email, darkMode, } = matchedData(req);
        const sqlQuery = `
        UPDATE
            settings
        SET
            usersid=?,
            appNotifications=?,
            emailNotifications=?,
            darkMode=?
        WHERE
           usersid=?         
        `;
        db.execute(sqlQuery, [usersid, app, email, darkMode, usersid], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows < 1) {
                return res.status(202).json({ message: "Settings not changed" })
            }

            res.status(200).json({ message: "Settings updated successfully" })
        })
    })
);

module.exports = router;


