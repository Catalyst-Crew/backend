const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

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
);

router.get('/all',
    expressAsyncHandler((_, res) => {
        const sqlQuery = `
        SELECT 
            id,	
            access_pointsid,	
            active,	
            modified_by,	
            available,	
            deviceId,	
            created,	
            last_updated
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
            getNewID(),
            deviceId ? 1 : 0,
            timestamp,
            timestamp,
            userId,
            access_pointsid,
            deviceId ? deviceId : null,
        ];

        db.execute(sqlQuery, sqlParams, (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not created." });
            }

            addLogToQueue(userId, "Sensor", `Sensor created successfully by ${userId} at ${timestamp} with id ${dbResults.insertId} and access_pointsid ${access_pointsid} and deviceid ${deviceId}`);

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
            active = ?, 
            modified_by = ?, 
            available = ?, 
            deviceId = ? ,
            last_updated = ?
        WHERE
            id = ?;
        `;

        db.execute(sqlQuery, [active, username, available, deviceId ? deviceId : null, getTimestamp(), id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addLogToQueue(id, "Sensor", `Sensor updated successfully by ${username} at ${getTimestamp()} available ${available} and active ${active}`);

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
                deviceId = null,
                modified_by = ?,
                last_updated = ?
            WHERE
                id = ?;
        `;

        db.execute(sqlQuery, [username, getTimestamp(), id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addLogToQueue(id, Sensor, `Sensor ${id} unassigned successfully by ${username} at ${getTimestamp()} with deviceid ${deviceId}`);

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
            sensorsid = null,
            updated_by = ?,
            last_updated = ?
        WHERE
            sensorsid = ?;
        `;

        db.execute(sqlQuery, [username, getTimestamp(), id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }
            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addLogToQueue(id, "Sensor", `Sensor unassigned successfully by ${username} at ${getTimestamp()}`);

            res.status(200).json({ message: "Sensor unassigned successfully." })
        })
    })
);

module.exports = router