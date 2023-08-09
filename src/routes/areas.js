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
    expressAsyncHandler((_, res) => {
        db.execute(`
            SELECT 
                id, 
                id_prefix, 
                name, 
                lat, 
                longitude 
            FROM 
                areas;
            `,
            [], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                res.status(200).json(dbResults)
            }
        )
    })
);

module.exports = router