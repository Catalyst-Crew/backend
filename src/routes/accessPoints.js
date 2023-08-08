const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
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

router.get('/',
    expressAsyncHandler((req, res) => {

        const sqlQuery = `
            SELECT
                id,
                areasid,
                active,
                created
            FROM
                access_points;
        `;

        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            res.status(200).json(dbResults)
        })
    })
);

router.put('/:id',
    [
        check("id", "access_points id is required").escape().notEmpty().isString(),
        check("status", "Status id is required").escape().notEmpty().isNumeric(),
        check("username", "username is required").escape().notEmpty().isString(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, status, username } = matchedData(req);

        const sqlQuery = `
            UPDATE
                access_points
            SET
                active=?
            WHERE
                id=?
        `;

        db.execute(sqlQuery, [status, id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows < 1) {
                return res.status(202).json({ message: "Access Point not changed" })
            }

            addLogToQueue(id, username, `Access Point ${id} status changed to ${status}`);

            res.status(200).json({ message: "Access Point updated successfully" })
        })
    })
);

// router.put('/:id',
//     [
//         check("id", "usersid is required").escape().notEmpty().isString(),
//         check("areasid", "areas id is required").escape().notEmpty().isNumeric()

//     ],
//     validationErrorMiddleware,
//     expressAsyncHandler((req, res) => {
//         const { id, areasid } = matchedData(req);
//         const sqlQuery = `
//         UPDATE
//             accessPoints
//         SET
//             areasid=?
//         WHERE
//            id=?         
//         `;
//         db.execute(sqlQuery, [areasid, id], (err, dbResults) => {
//             if (err) {
//                 return res.status(500).json({ error: ENV ? err : 1 });
//             }

//             if (dbResults.affectedRows < 1) {
//                 return res.status(202).json({ message: "Access Point not changed" })
//             }

//             res.status(200).json({ message: "Access Point updated successfully" })
//         })
//     })
// );

router.post('/',
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const sqlQuery = `
            SELECT
                id,
                areasid
            FROM
                accessPoints
       //     WHERE
       //         id=?
     //       LIMIT 1
        `;

        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }


            res.status(200).json(dbResults)
        })
    })
);

module.exports = router;
