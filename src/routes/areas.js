const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { addToQueue, queueNames } = require('../utils/logs');
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
                longitude,
                draw_coords
            FROM 
                areas;
            `,
            [], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                return res.status(200).json(dbResults)
            }
        )
    })
);

router.get('/:id',
    check('id').toInt().isInt().withMessage("Invalid area id"),
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id } = matchedData(req);

        db.execute(`
            SELECT
                *
            FROM
                areas
            WHERE
                id = ?;
            `,
            [id], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1, message: "Can not perform that action right now #1" });
                }

                res.status(200).json(dbResults[0])
            }
        )
    })
);

const validateArryOptions = [
    check("username").isLength({ min: 5 }).withMessage("Invalid username"),
    check('name').isString().isLength({ min: 5 }).withMessage("Invalid name"),
    check("lat").isFloat().withMessage("Invalid latitude").toFloat(),
    check("longitude").isFloat().withMessage("Invalid longitude").toFloat(),
    check("draw_coords").isArray().custom((arr) => {
        return arr.length >= 4 && arr.every(subArray => Array.isArray(subArray));
    }
    ).withMessage("Invalid draw_coords must be array of arrays of coordinates (lat, long) ex: [[1,2], [3,4] ...]. Minimum 4 coordinates [")
]

router.post('/',
    validateArryOptions,
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { name, lat, longitude, draw_coords, username } = matchedData(req);

        db.execute(`
            INSERT INTO
                areas
                (name, lat, longitude, draw_coords)
            VALUES
                (?, ?, ?, ?);
            `,
            [name, lat, longitude, JSON.stringify(draw_coords)], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1, message: "Can not perform that action right now #2" });
                }

                if (dbResults.affectedRows === 0) {
                    return res.status(500).json({ error: ENV ? err : 1, message: "Can not perform that action right now #3" });
                }

                addToQueue(queueNames.LOGGER, { generatee_id: username, generatee_name: "Areas", massage: `Created area ${name} with id ${dbResults.insertId}` })

                return res.status(200).json({ message: "Area created successfully" })
            }
        )
    })
);

router.put('/:id',
    validateArryOptions,
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, username, name, lat, longitude, draw_coords } = matchedData(req);

        db.execute(`
            UPDATE
                areas
            SET
                name = ?,
                lat = ?,
                longitude = ?,
                draw_coords = ?
            WHERE
                id = ?;
            `,
            [name, lat, longitude, JSON.stringify(draw_coords), id], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1, message: "Can not perform that action right now #4" });
                }

                if (dbResults.affectedRows === 0) {
                    return res.status(203).json({ error: ENV ? err : 1, message: "No area updated #5" });
                }

                addToQueue(queueNames.LOGGER, { generatee_id: username, generatee_name: "Areas", massage: `Updated area ${name} with id ${id}` })

                return res.status(200).json({ message: "Area updated successfully" })
            }
        )
    })
);

router.delete('/:id',
    [
        check('id').toInt().isInt().withMessage("Invalid area id"),
        check("username").isLength({ min: 5 }).withMessage("Invalid username")
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, username } = matchedData(req);

        db.execute(`
            DELETE FROM
                areas
            WHERE
                id = ?;
            `,
            [id], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1, message: "Can not perform that action right now #6" });
                }

                if (dbResults.affectedRows === 0) {
                    return res.status(203).json({ error: ENV ? err : 1, message: "No area deleted #7" });
                }

                addToQueue(queueNames.LOGGER, { generatee_id: username, generatee_name: "Areas", massage: `Deleted area with id ${id}` })

                return res.status(200).json({ message: "Area deleted successfully" })
            }
        )
    })
);

module.exports = router;