const { Router } = require('express');
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
    expressAsyncHandler((_, res) => {
        const sqlQuery = `
        WITH SensorDetails AS (
            SELECT
                s.id AS sensor_id,
                s.id_prefix AS sensor_id_prefix,
                s.status AS sensor_status,
                s.device_id AS sensor_device_id,
                s.available AS sensor_available,
                s.updated_by AS sensor_updated_by,
                s.updated_at AS sensor_updated_at,
                s.created_by AS sensor_created_by,
                s.created_at AS sensor_created_at,
                (SELECT JSON_OBJECT(
                    'miner_id', mn.id,
                    'miner_id_prefix', mn.id_prefix,
                    'miner_name', mn.name,
                    'miner_email', mn.email,
                    'miner_status', mn.status,
                    'miner_created_at', mn.created_at,
                    'miner_created_by', mn.created_by,
                    'miner_updated_at', mn.updated_at,
                    'miner_updated_by', mn.updated_by,
                    'miner_user_id', mn.user_id,
                    'miner_shift_id', mn.shift_id
                ) FROM miners mn WHERE mn.sensor_id = s.id) AS miner_info,
                (SELECT JSON_OBJECT(
                    'area_id', ar.id,
                    'area_id_prefix', ar.id_prefix,
                    'area_name', ar.name,
                    'area_lat', ar.lat,
                    'area_longitude', ar.longitude,
                    'area_created_at', ar.created_at
                ) FROM areas ar JOIN access_points ap ON ap.area_id = ar.id WHERE ap.id = m.access_point_id) AS area_info,
                (SELECT JSON_OBJECT(
                    'access_point_id', ap.id,
                    'access_point_id_prefix', ap.id_prefix,
                    'access_point_name', ap.name,
                    'access_point_lat', ap.lat,
                    'access_point_longitude', ap.longitude,
                    'access_point_status', ap.status,
                    'access_point_device_id', ap.device_id,
                    'access_point_created_at', ap.created_at
                ) FROM access_points ap WHERE ap.id = m.access_point_id) AS access_point_info,
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'measurement_id', mx.id,
                        'measurement_id_prefix', mx.id_prefix,
                        'measurement_created_at', mx.created_at,
                        'measurement_location', mx.location,
                        'measurement_other_data', mx.other_data
                    )
                ) FROM measurements mx WHERE mx.sensor_id = s.id) AS measurements
            FROM sensors s
            LEFT JOIN measurements m ON s.id = m.sensor_id
            WHERE s.available = 0
        )
        SELECT
            sensor_id,
            sensor_id_prefix,
            sensor_status,
            sensor_device_id,
            sensor_available,
            sensor_updated_by,
            sensor_updated_at,
            sensor_created_by,
            sensor_created_at,
            miner_info,
            area_info,
            access_point_info,
            measurements
        FROM SensorDetails;
    `;

        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }
            res.status(200).json(dbResults)
        })
    }
    )
);

module.exports = router;

