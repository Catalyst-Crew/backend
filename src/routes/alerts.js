const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const centralEmitter = require('../utils/events');
const { verifyToken } = require('../utils/tokens');
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

router.get('/',
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {

        const sqlQuery = `
            SELECT
                id,
                id_prefix,
                sensor_id,
                name,
                status,
                created_at
            FROM
                sensor_alerts;
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
        check("id", "alerts id is required").escape().notEmpty().isString(),
        check("name", "name is required").escape().notEmpty().isNumeric()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, name } = matchedData(req);
        const sqlQuery = `
            UPDATE sensor_alerts SET 
                status = 2
            WHERE
                id = ?;   
        `;
        db.execute(sqlQuery, [id, name], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows < 1) {
                return res.status(202).json({ message: "alerts not changed" })
            }

            res.status(200).json({ message: "alerts updated successfully" })
        })
    })
);

router.post('/',
    [
        check("sensor", "sensor is required").escape().notEmpty(),
        check("name", "name is required").escape().notEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { sensor, name } = matchedData(req);


        db.execute(`
            INSERT INTO
                sensor_alerts 
                (
                sensor_id,
                name,
                status
                )
            VALUES
                (?, ?, ?);
            `,
            [sensor, name, 1], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                res.status(200).json(dbResults)

                db.execute(`SELECT * FROM sensor_alerts WHERE id = ?`, [dbResults.insertId], (err, dbResults) => {
                    if (err) {
                        throw err;
                    }

                    centralEmitter.emit("new_alert", dbResults[0])
                })
            }
        )
    })
);


module.exports = router;
