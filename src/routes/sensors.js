const { Router } = require('express');
const expressAsyncHandler = require('express-async-handler');
const { check, validationResult } = require("express-validator");

const { addLogToQueue } = require('../utils/logs');
const { verifyToken } = require('../utils/tokens');
const { db, getNewID, getTimestamp } = require('../utils/database');
const { validationErrorMiddleware } = require('../utils/middlewares');

const ENV = process.env.IS_DEV === "true";

const router = Router()

router.use(expressAsyncHandler(async (req, res, next) => {
    if (!ENV) {
        verifyToken(req, res, next); //uncomment in production
    }

    if (ENV) {
        next() //Remove this on production
    }
}
))

//get all sensors
router.get('/',
    expressAsyncHandler((_, res) => {
        const sqlQuery = `
        SELECT 
            id
        FROM 
            sensors
        WHERE 
            available = 1 
        AND 
            active = 1
        ;`;

        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.length === 0) {
                return res.status(202).json({ message: "No available sesnsor please add more on 'Access Points' tab." });
            }
            res.status(200).json({ message: "Sensors fetched successfully.", data: dbResults })
        })

    })
)

// POST /create new sensor
router.post('/create',
    [
        check('userId', 'UserId is required').escape().not().isEmpty(),
        check('access_pointsid', 'Access Point required').escape().not().isEmpty(),
        check('deviceId', 'Can be null').escape(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { access_pointsid, deviceId, userId } = req.body

        const timestamp = getTimestamp();
        const sqlQuery = `
        INSERT INTO sensors(
            id, 
            available, 
            created, 
            last_updated,
            modified_by, 
            access_pointsid,
            deviceid
        ) 
        VALUES(
            ?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?
        );`;

        const sqlParams = [
            getNewID(), // generated
            deviceId ? 1 : 0, // generated
            timestamp, // generated
            timestamp, // generated
            userId,
            access_pointsid,
            deviceId ? deviceId : null,
        ];

        db.execute(sqlQuery, sqlParams, (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            addLogToQueue(userId, "Sensor", `Sensor ${dbResults.insertId} created by ${userId}`);

            res.status(201).json({ message: "Sensor created successfully.", data: dbResults })
        }
        )
    })
)

// PUT /update sensor
router.put('/update',

    [
        check('id', 'ID is required').escape().not().isEmpty(),
        check('name', 'Name is required').escape().not().isEmpty(),
        check('location', 'Location is required').escape().not().isEmpty(),
        check('type', 'Type is required').escape().not().isEmpty(),
        check('ip', 'IP is required').escape().not().isEmpty(),
        check('port', 'Port is required').escape().not().isEmpty(),
        check('available', 'Available is required').escape().not().isEmpty(),
        check('active', 'Active is required').escape().not().isEmpty(),
        check('updated_by', 'Updated by is required').escape().not().isEmpty(),
    ],
    expressAsyncHandler(async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({ message: errors.array() })
        }

        const { id, name, location, type, ip, port, available, active, updated_by } = req.body

        const sqlQuery = `
        UPDATE
            sensors
        SET
            name = ?,
            location = ?,
            type = ?,
            ip = ?,
            port = ?,
            available = ?,
            active = ?,
            updated_by = ?,
            last_updated = ?
        WHERE
            id = ?;
        `;
        const sqlParams = [
            name,
            location,
            type,
            ip,
            port,
            available,
            active,
            updated_by,
            getTimestamp(),
            id
        ];

        db.execute(sqlQuery, sqlParams, (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            addLogToQueue(updated_by, "Sensor", `Sensor ${id} updated by ${updated_by}`);

            res.status(200).json({ message: "Sensor updated successfully." })
        }
        )
    }
    )
)

module.exports = router