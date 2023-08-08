const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { addLogToQueue } = require('../utils/logs');
const { verifyToken } = require('../utils/tokens');
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
        const sqlQuery = ENV ? `
                SELECT 
                    id,
                    id_prefix,
                    status,
                    device_id,
                    available,
                    updated_by,
                    updated_at,
                    created_by,
                    created_at
                FROM 
                    sensors
                ;` : `
                SELECT 
                    id,
                    id_prefix,
                    status,
                    device_id,
                    available,
                    updated_by,
                    updated_at,
                    created_by,
                    created_at
                FROM 
                    sensors
                WHERE 
                    available = 1 
                AND 
                    status = 1
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
);

router.get('/all',
    expressAsyncHandler((_, res) => {
        const sqlQuery = `
        SELECT 
            id,
            id_prefix,
            status,
            device_id,
            available,
            updated_by,
            updated_at,
            created_by,
            created_at
        FROM 
            sensors
        ;`;

        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            res.status(200).json(dbResults)
        })
    })
);

// POST /create new sensor
router.post('/create',
    [
        check('userId', 'UserId is required').escape().not().isEmpty(),
        check('deviceId', 'Can be null').escape(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { deviceId, userId } = req.body

        const sqlQuery = `
            INSERT INTO
                sensors (
                    status,
                    device_id,
                    updated_by,
                    created_by
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?
                );`
            ;

        const sqlParams = [
            deviceId ? 1 : 0,
            deviceId ? deviceId : null,
            userId,
            userId
        ];

        db.execute(sqlQuery, sqlParams, (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not created." });
            }

            addLogToQueue(userId, "Sensor", `Sensor created successfully by ${userId} with id ${dbResults.insertId} and deviceid ${deviceId}`);

            res.status(201).json({ message: "Sensor created successfully.", data: dbResults })
        })
    })
)

// PUT /update sensor
router.put('/',
    [
        check('id', 'ID is required').escape().not().isEmpty(),
        check('available', 'Available is required').escape().not().isEmpty(),
        check('active', 'Active is required').escape().not().isEmpty(),
        check('deviceId', 'Can be null').escape(),
        check('username', 'Updated by is required').escape().not().isEmpty(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, available, active, deviceId, username } = matchedData(req);

        const sqlQuery = `
        UPDATE sensors SET 
            status = ?, 
            available = ?, 
            updated_by = ?, 
            device_id = ?           
        WHERE
            id = ?;
        `;

        db.execute(sqlQuery, [active, available, username, deviceId ? deviceId : null, id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addLogToQueue(id, "Sensor", `Sensor updated successfully by ${username} available ${available}, deviceId ${deviceId} and active ${active}`);

            res.status(200).json({ message: "Sensor updated successfully." })
        })
    })
)

router.put('/unassign',
    [
        check('id', 'ID is required').escape().not().isEmpty(),
        check('deviceId', 'DeviceId is required').escape().not().isEmpty(),
        check('username', 'username is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, deviceId, username } = matchedData(req);

        const sqlQuery = `
            UPDATE
                sensors
            SET
                available = 0,
                status = 1, 
                device_id = null, 
                available = 1, 
                updated_by = ?
            WHERE
                id = ?;
        `;

        db.execute(sqlQuery, [username, id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addLogToQueue(id, Sensor, `Sensor ${id} unassigned successfully by ${username} with deviceid ${deviceId}`);

            res.status(200).json({ message: "Sensor unassigned successfully." })
        })
    })
);

router.put('/unassign/:id',
    [
        check('id', 'ID is required').escape().not().isEmpty(),
        check('username', 'username is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, username } = matchedData(req);

        const sqlQuery = `
        UPDATE
            miners
        SET
            sensor_id = null,
            updated_by = ?
        WHERE
            sensorsid = ?;
        `;

        db.execute(sqlQuery, [username, id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }
            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addLogToQueue(id, "Sensor", `Sensor unassigned successfully by ${username}`);

            res.status(200).json({ message: "Sensor unassigned successfully." })
        })
    })
);

module.exports = router