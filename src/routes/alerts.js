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
                create_id
            FROM
                alerts
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
        const { id,name} = matchedData(req);
        const sqlQuery = `
        UPDATE
            settings
        SET
            id=?,
            id_prefix=?,
            sensor_id=?,
            name=?,
            status=?,
            create_id=?
        WHERE
           id=?         
        `;
        db.execute(sqlQuery, [id,name], (err, dbResults) => {
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
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
    const sqlQuery = `
            SELECT
                id,
                id_prefix,
                sensor_id,
                name,
                status,
                create_id
            FROM
                alerts
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
