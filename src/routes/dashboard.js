const { Router } = require('express');
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
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

router.get('/',
    validationErrorMiddleware,
    expressAsyncHandler((_, res) => {
        const query =
            `
            SELECT
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'area_id', ar.id,
                        'area_name', ar.name,
                        'area_latitude', ar.lat,
                        'area_longitude', ar.longitude,
                        'id_prefix_area', ar.id_prefix,
                        'area_created_at', ar.created_at,
                        'access_points', ap_json.access_points,
                        'supervisor', us.name
                    )
                ) AS areas
            FROM
                areas ar
            LEFT JOIN (
                SELECT DISTINCT
                   name,
                   area_id
                FROM
                    users
            ) us ON ar.id = us.area_id

            INNER JOIN (
                SELECT
                    area_id,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'area_id', ap.area_id,
                            'area_name', ar.name,
                            'access_point_id', ap.id,
                            'device_id', ap.device_id,
                            'access_point_name', ap.name,
                            'access_point_latitude', ap.lat,
                            'access_point_status', ap.status,
                            'measurements', mea_json.measurements,
                            'id_prefix_access_point', ap.id_prefix,
                            'access_point_longitude', ap.longitude,
                            'access_point_created_at', ap.created_at
                        )
                    ) AS access_points
                FROM
                    access_points ap
                    INNER JOIN areas ar ON ap.area_id = ar.id
                LEFT JOIN (
                    SELECT
                        access_point_id,
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', mea.id,
                                'miner_id', min.id,
                                'miner_name', min.name,
                                'location', mea.location,
                                'sensor_id', mea.sensor_id,
                                'miner_shift', min.shift_id,
                                'other_data', mea.other_data,
                                'created_at', mea.created_at,
                                'miner_supervisor', min.user_id,
                                'access_point_id', mea.access_point_id,
                                'measurement_id_prefix', mea.id_prefix,
                                'sensor_id_prefix', sen_json.id_prefix,
                                'sensor_device_id', sen_json.device_id,
                                'shift_name', shi.name
                            )
                        ) AS measurements
                    FROM (
                        SELECT
                            m1.*
                        FROM
                            measurements m1
                        INNER JOIN (
                            SELECT
                                sensor_id,
                                MAX(created_at) AS latest_created_at
                            FROM
                                measurements
                            GROUP BY
                                sensor_id
                        ) m2 ON m1.sensor_id = m2.sensor_id AND m1.created_at = m2.latest_created_at
                    ) mea
                    INNER JOIN sensors sen_json ON mea.sensor_id = sen_json.id
                    INNER JOIN miners min ON sen_json.id = min.sensor_id
                    INNER JOIN shifts shi ON min.shift_id = shi.id
                    GROUP BY
                        access_point_id
                ) mea_json ON ap.id = mea_json.access_point_id
                GROUP BY
                    area_id
            ) ap_json ON ar.id = ap_json.area_id;
        `;

        db.execute(query, [], expressAsyncHandler((err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }


            const areas = dbResults[0].areas.map(area => {
                return {
                    area_id: area.area_id,
                    area_name: area.area_name,
                    area_latitude: area.area_latitude,
                    area_longitude: area.area_longitude,
                    id_prefix_area: area.id_prefix_area,
                    area_created_at: area.area_created_at,
                    supervisor: area.supervisor
                }
            });

            const access_points = dbResults[0].areas.map(area => {
                return area.access_points.map(access_point => {
                    return {
                        area_id: access_point.area_id,
                        area_name: access_point.area_name,
                        device_id: access_point.device_id,
                        access_point_id: access_point.access_point_id,
                        access_point_name: access_point.access_point_name,
                        access_point_status: access_point.access_point_status,
                        access_point_latitude: access_point.access_point_latitude,
                        id_prefix_access_point: access_point.id_prefix_access_point,
                        access_point_longitude: access_point.access_point_longitude,
                        access_point_created_at: access_point.access_point_created_at,
                        measurements: access_point.measurements
                    }
                })
            }).flat();

            const uniqueAccessPointIds = new Set();

            //Filter out duplicates
            const uniqueArray = access_points.filter((obj) => {
                if (!uniqueAccessPointIds.has(obj.access_point_id)) {
                    uniqueAccessPointIds.add(obj.access_point_id);
                    return true;
                }
            });

            res.status(200).json({ areas, access_points: uniqueArray })
        }))
    })
);

module.exports = router;

