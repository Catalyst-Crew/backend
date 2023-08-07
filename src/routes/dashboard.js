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
            SELECT
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('miners_id', mi.id, 'name', mi.name, 'sensorsid', mi.sensorsid, 'shift', mi.shift, 'last_updated', mi.last_updated, 'access_pointsid', s.access_pointsid, 'deviceId', s.deviceId, 'last_updated', s.last_updated)) 
                FROM miners AS mi
                JOIN sensors AS s ON mi.sensorsid = s.id
                WHERE s.active = 1) AS miners,   
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('access_points_id', id, 'areasid', areasid,  'log', log, 'lat', lat)) FROM access_points) AS access_points,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('measurements_id', id, 'sensorsid', sensorsid, 'access_pointsid', access_pointsid, 'timestamp', timestamp, 'location', location)) FROM measurements) AS measurements,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('sensors_id', id, 'access_pointsid', access_pointsid, 'active', active, 'deviceId', deviceId, 'last_updated', last_updated)) FROM sensors) AS sensors;
            `;

        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }
            res.status(200).json(dbResults[0])
        })
    }
    )
);

// create socket connection
// router.ws('/socket', (ws, req) => {
//     ws.on('message', (msg) => {
//         console.log(msg);
//     });
//     ws.send('something');
// });

module.exports = router;