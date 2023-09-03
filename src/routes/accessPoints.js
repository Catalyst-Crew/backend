const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
const { validationErrorMiddleware } = require('../utils/middlewares');
const { centralEmitter, serverEvents } = require('../utils/events');

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
                ap.id AS id,
                ap.id_prefix AS id_prefix,
                ap.area_id AS area_id,
                ap.name AS name,
                ap.lat AS lat,
                ap.longitude AS longitude,
                ap.status AS status,
                ap.device_id AS device_id,
                a.id_prefix AS area_id_prefix,
                a.name AS area_name,
                CONCAT(a.lat,',',a.longitude) AS location,
                a.lat AS area_lat,
                a.longitude AS area_longitude
            FROM
                access_points ap
            INNER JOIN
                areas a ON ap.area_id = a.id;
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

router.put('/:id',
    [
        check("id", "access_points id is required").escape().notEmpty().toInt(),
        check("status", "Status id is required").escape().notEmpty().toInt(),
        check("username", "username is required").escape().notEmpty().isString(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, status, username } = matchedData(req);

        db.execute(`
            UPDATE
                access_points
            SET
                status=?
            WHERE
                id=?
            ;`
            , [status, id], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.affectedRows < 1) {
                    return res.status(202).json({ message: "Access Point not changed" })
                }

                centralEmitter.emit(serverEvents.ACCESS_POINT, { id, status })

                addLogToQueue(id, username, `Access Point ${id} status changed to ${status}`);

                res.status(200).json({ message: "Access Point updated successfully" })
            }
        )
    })
);

router.put('/full/:id',
    [
        check("id", "usersid is required").escape().notEmpty().isString(),
        check("area_id", "areas id is required").escape().notEmpty(),
        check("name", "name is required").escape().notEmpty(),
        check("lat", "lat is required").escape().notEmpty(),
        check("longitude", "longitude is required").escape().notEmpty(),
        check("username", "username is required").escape().notEmpty(),
        check("device_id", "device_id is required").escape(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, area_id, name, lat, longitude, username, device_id } = matchedData(req);

        const deviceId = device_id ? device_id : null;

        db.execute(`
            UPDATE access_points SET 
                area_id = ?, 
                name = ?, 
                lat = ?, 
                longitude = ?, 
                device_id = ? 
            WHERE
                id = ?;        
            `,
            [
                parseInt(area_id),
                name,
                parseFloat(lat),
                parseFloat(longitude),
                deviceId,
                parseInt(id)
            ],
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.affectedRows < 1) {
                    return res.status(202).json({ message: "Access Point not changed" })
                }

                db.execute(`
                    SELECT
                        ap.area_id AS area_id,
                        ap.id AS access_point_id,
                        a.name AS area_name,
                        ap.device_id AS device_id,
                        ap.name AS access_point_name,
                        ap.id_prefix AS id_prefix,
                        ap.device_id as device_id,
                        ap.lat AS access_point_latitude,
                        ap.longitude AS access_point_longitude
                    FROM
                        access_points ap
                    INNER JOIN
                        areas a ON ap.area_id = a.id
                    WHERE ap.id = ?
                    `, [parseInt(id)], (err, dbResults2) => {
                    if (err) {
                        return res.status(405).json({ error: ENV ? err : 1, message: "Access Point updated successfully but failed to forward to other clients", })
                    }

                    centralEmitter.emit(serverEvents.ACCESS_POINT_FULL, dbResults2[0])

                    addLogToQueue(username, "Access-Point", `Access Point ${id} updated successfully by ${username} with area_id ${area_id} and name ${name} and lat ${lat} and longitude ${longitude} and device_id ${deviceId}`);

                    res.status(200).json({ message: "Access Point updated successfully" })

                })
            }
        )
    })
);

router.post('/',
    [
        check("area_id", "area_id is required").escape().notEmpty().isNumeric().toInt(),
        check("name", "name is required").escape().notEmpty().isString(),
        check("latitude", "latitude is required").escape().notEmpty().isNumeric().toInt(),
        check("longitude", "longitude is required").escape().notEmpty().isNumeric().toInt(),
        check("status", "status is required").escape().notEmpty().isNumeric().toInt(),
        check("device_id", "device_id is required").escape().isString(),
        check("username", "username is required").escape().notEmpty().isString()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { area_id, name, latitude, longitude, status, device_id, username } = matchedData(req);

        const deviceId = device_id ? device_id : null;

        db.execute(`
            INSERT INTO access_points(
                area_id, 
                name, 
                lat, 
                longitude, 
                status, 
                device_id
            ) 
            VALUES(
                ?, 
                ?, 
                ?, 
                ?, 
                ?, 
                ?
            );`,
            [area_id, name, parseInt(latitude), parseInt(longitude), parseInt(status), deviceId],
            expressAsyncHandler((err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.affectedRows < 1) {
                    return res.status(400).json({ message: "Access Point not created" })
                }

                addLogToQueue(username, "Access-Point", `Access Point created successfully by ${username} with area_id ${area_id} and name ${name} and lat ${latitude} and longitude ${longitude} and device_id ${deviceId}`);

                return res.status(200).json({ message: "Access Point created successfully" })
            })
        )
    })
);

module.exports = router;
