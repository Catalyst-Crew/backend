const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { getDaysFromNow } = require('../utils/functions');
const { validationErrorMiddleware } = require('../utils/middlewares');

const router = Router();
const ENV = process.env.IS_DEV === "true";

router.use(
    expressAsyncHandler(async (req, res, next) => {
        if (!ENV) {
            verifyToken(req, res, next); //uncomment in production
        }

        if (ENV) {
            next() //Remove this on production
        }
    })
);

router.get("/",
    (_req, res) => {
        const dateFilter = getDaysFromNow(5)

        db.execute(`
        SELECT 
            *
        FROM 
            announcements
        WHERE
            created_at >= ?;`,
            [dateFilter],
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ message: "Server error while creating the announcement." })
                }

                return res.json(dbResults)
            }
        )
    }
);

router.post("/",
    (req, res, next) => {
        if (req.userData && req.userData.user_role_id < 1_000_001) {
            return res.status(403).json({ message: "You are not allowed to post announcements." })
        }
        next()
    },
    [
        check("ann_name").isString().withMessage("Expected a string").escape().notEmpty().withMessage("Announcement name required!"),
        check("ann_message").isString().withMessage("Expected a string").escape().notEmpty().withMessage("Announcement message required!"),
        check("ann_user_id").escape().notEmpty().withMessage("User id name required!").toInt(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { ann_name, ann_message, ann_user_id } = matchedData(req);

        db.execute(`
            INSERT INTO announcements( 
                usersid, 
                name, 
                message) 
            VALUES 
                (?, 
                ?,  
                ?);
            `,
            [ann_user_id, ann_name, ann_message],
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ message: "Server error while creating the announcement." })
                }

                if (dbResults.affectedRows) {
                    return res.json({ message: "New announcement created successfullt." })
                }

                return res.status(400).json({ message: "Something went wrong creating the announcement. Please try again." })
            }
        )
    })
);


module.exports = router