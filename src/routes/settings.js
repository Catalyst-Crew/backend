const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
const { db, getTimestamp } = require('../utils/database');
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

// Get user setting base on id  of the user
router.get('/:user_id',
    check("user_id", "user_id is required").escape().notEmpty(),
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { user_id } = matchedData(req);

        db.execute(`
            SELECT 
                user_id, 
                app_notifications, 
                email_notifications, 
                dark_mode,
                phone,
                name,
                email
            FROM 
                settings
            INNEr JOIN 
                users ON settings.user_id=users.id
            WHERE
                user_id=?
            LIMIT 1;
            `,
            [parseInt(user_id)], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.length === 0) {
                    return res.status(202).json({ message: "No settings found" });
                }

                res.status(200).json(dbResults[0])
            }
        )
    })
);

// Upadate user settings base on id of the user
router.put('/:user_id',
    [
        check("user_id", "user_id is required").escape().notEmpty().isString(),
        check("app_notifications", "appNotification is required").escape().notEmpty().isNumeric(),
        check("email_notifications", "emailNotification is required").escape().notEmpty().isNumeric(),
        check("dark_mode", "darkMode is required").escape().notEmpty().isNumeric(),

    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { user_id, app_notifications, email_notifications, dark_mode } = matchedData(req);

        db.execute(`
            UPDATE
                settings
            SET
                user_id=?,
                app_notifications=?,
                email_notifications=?,
                dark_mode=?
            WHERE
                user_id=?         
            `,
            [parseInt(user_id), parseInt(app_notifications), parseInt(email_notifications), parseInt(dark_mode), parseInt(user_id)],
            expressAsyncHandler((err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.affectedRows < 1) {
                    return res.status(202).json({ message: "Settings not changed" })
                }

                addLogToQueue(user_id, "Settings", `Settings updated successfully by ${user_id} at ${getTimestamp()} with appNotifications ${app_notifications} and emailNotifications ${email_notifications} and darkMode ${dark_mode}`);

                res.status(200).json({ message: "Settings updated successfully" })
            }
            )
        )
    })
);

module.exports = router;


