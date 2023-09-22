const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { verifyToken } = require('../utils/tokens');
const { db, connection } = require('../utils/database');
const { addToQueue, queueNames } = require('../utils/logs');
const { validationErrorMiddleware } = require('../utils/middlewares');

const router = Router();
const ENV = process.env.IS_DEV === "true";

router.use(expressAsyncHandler(async (req, res, next) => {
    if (!ENV) {
        verifyToken(req, res, next); //uncomment in production
    }

    if (ENV) {
        next() //Remove this on production
    }
}));

//get all sensors
router.get('/',
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

//get all sensors regardless of status
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
router.post('/',
    [
        check('user_id', 'UserId is required').escape().not().isEmpty().toInt(),
        check('device_id', 'Can be null').escape(),
        check('status', 'This field is required').escape().notEmpty().isNumeric().toInt(),
        check('available', 'This field is required').escape().notEmpty().isNumeric().toInt(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { device_id, user_id, available, status } = matchedData(req)

        const sqlQuery = `
            INSERT INTO
                sensors (
                    status,
                    device_id,
                    updated_by,
                    created_by,
                    available
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                );`
            ;

        const sqlParams = [
            device_id ? status : 0,
            device_id ? device_id : null,
            user_id,
            user_id,
            device_id ? available : 0
        ];

        db.execute(sqlQuery, sqlParams, (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not created." });
            }

            addToQueue(queueNames.LOGGER, { generatee_id: user_id, generatee_name: "Sensor", massage:`Sensor created successfully with id ${dbResults.insertId} and deviceid ${device_id}`})

            res.status(201).json({ message: "Sensor created successfully.", data: dbResults })
        })
    })
)

// PUT /update sensor
router.put('/',
    [
        check('id', 'ID is required').escape().not().isEmpty(),
        check('available', 'Available is required').escape().not().isEmpty(),
        check('status', 'Status is required').escape().not().isEmpty(),
        check('device_id', 'Can be null').escape(),
        check('username', 'Updated by is required').escape().not().isEmpty(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, available, status, device_id, username } = matchedData(req);

        const sqlQuery = `
            UPDATE sensors SET 
                status = ?, 
                available = ?, 
                updated_by = ?, 
                device_id = ?           
            WHERE
                id = ?;
            `;

        const deviceId = device_id ? device_id : null;

        db.execute(sqlQuery, [parseInt(status), parseInt(available), username, deviceId, parseInt(id)], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (dbResults.affectedRows === 0) {
                return res.status(202).json({ message: "Sensor not updated." });
            }

            addToQueue(queueNames.LOGGER, { generatee_id: username, generatee_name: "Sensor", massage:`Sensor updated successfully by ${username} available ${available}, deviceId ${device_id} and active ${status}`})

            res.status(200).json({ message: "Sensor updated successfully." })
        })
    })
)

// PUT /update sensor remove device from sensor
router.put('/unassign',
    [
        check('id', 'ID is required').escape().not().isEmpty().toInt(),
        check('username', 'Username is required').escape().not().isEmpty().toInt()
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, username } = matchedData(req);

        try {
            (await connection).beginTransaction();

            await (await connection).execute(`
                UPDATE
                    miners
                SET
                    sensor_id = null,
                    updated_by = ?
                WHERE
                    sensor_id = ?;
                `, [username, parseInt(id)]);

            (await connection).execute(
                'UPDATE sensors SET available = 0, status = 0, device_id = null WHERE id = ?',
                [parseInt(id)]
            ).then(async ([dbResults]) => {
                if (dbResults.affectedRows === 0) {
                    (await connection).rollback();
                    return res.status(400).json({ message: "Sensor not updated. #2" });
                }
            });

            await (await connection).commit();

            addToQueue(queueNames.LOGGER, { generatee_id: username, generatee_name: "Sensor", massage: `Sensor unattaced from device successfully by ${username}`})

            res.status(200).json({ message: "Sensor unassigned successfully." });
        } catch (err) {
            await (await connection).rollback();
            console.error('Transaction Error:', err);
            return res.status(500).json({ error: ENV ? err : 1, message: "Sensor not updated. #3" });
        }
    })
);

// PUT /update sensor remove sensor from miner
router.put('/unassign/:id',
    [
        check('id', 'ID is required').escape().not().isEmpty().toInt(),
        check('username', 'username is required').escape().not().isEmpty().toInt()
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, username } = matchedData(req);

        try {
            (await connection).beginTransaction();

            const [dbResults] = await (await connection).execute(`
                UPDATE
                    miners
                SET
                    sensor_id = null,
                    updated_by = ?
                WHERE
                    sensor_id = ?;
                `, [username, parseInt(id)]);

            if (dbResults.affectedRows === 0) {
                await (await connection).rollback();
                return res.status(202).json({ message: "Sensor not updated." });
            }

            (await connection).execute(
                'UPDATE sensors SET available = 1 WHERE id = ?',
                [parseInt(id)]
            ).then(async ([dbResults]) => {
                if (dbResults.affectedRows === 0) {
                    (await connection).rollback();
                    return res.status(202).json({ message: "Sensor not updated." });
                }
            });

            await (await connection).commit();

            addToQueue(queueNames.LOGGER, { generatee_id: username, generatee_name: "Sensor", massage: `Sensor unassigned from device successfully by ${username}`})

            res.status(200).json({ message: "Sensor unassigned successfully." });
        } catch (err) {
            await (await connection).rollback();
            console.error('Transaction Error:', err);
            return res.status(500).json({ error: ENV ? err : 1 });
        }
    })
);

module.exports = router;