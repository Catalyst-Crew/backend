const { Router } = require('express');
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { check, matchedData } = require('express-validator');
const { centralEmitter, serverEvents } = require('../utils/events');
const { validationErrorMiddleware } = require('../utils/middlewares');

const router = Router();

router.get('/iot-data',
  check("Data").escape().trim(),
  validationErrorMiddleware,
  expressAsyncHandler(
    (req, res) => {
      const { Data } = matchedData(req);

      const dataArry = Data.split('*')
      const devices = ["1000CF57BC34", "1000CFF62B02"]

      let Id = devices[0]

      if (dataArry[5] === '1') {
        Id = devices[1]
      }

      if (dataArry[5] === '1' || dataArry[4] === '1') {
        db.execute(
          `
          SELECT
            s.id AS sensor_id,    
            ap.id AS access_point_id,
            ap.name AS access_point_name,
            
            a.id AS area_id,
            a.name AS area_name,
            
            m.id AS measurement_id,
            m.other_data AS measurement_other_data,
            
            min.name AS miner_name
          FROM sensors s

          LEFT JOIN (
              SELECT
                  m1.sensor_id,
                  MAX(m1.created_at) AS max_created_at
              FROM measurements m1
              GROUP BY m1.sensor_id
          ) latest_measurement ON s.id = latest_measurement.sensor_id

          LEFT JOIN measurements m ON latest_measurement.sensor_id = m.sensor_id AND latest_measurement.max_created_at = m.created_at

          LEFT JOIN access_points ap ON m.access_point_id = ap.id
          LEFT JOIN areas a ON ap.area_id = a.id
          LEFT JOIN miners min ON min.sensor_id = s.id
          WHERE s.device_id = ?;`,
          [Id],
          (err, dbResults) => {
            if (!err) {
              db.execute(`INSERT INTO sensor_alerts(sensor_id, name) VALUES (?, ?);`,
                [dbResults[0].sensor_id, dbResults[0].miner_name],
                (err, dbResults2) => {
                  if (!err) {
                    centralEmitter.emit(serverEvents.NEW_ALERT, { ...dbResults[0], alert_id: dbResults2.insertId });
                  }
                }
              )
            }
            return res.send("Ok")
          }
        )
      }

      if (dataArry[0] === '0' && dataArry[1] === '0' && dataArry[2] === '0' && dataArry[3] === '0') {
        return res.send("No change")
      }

      const aps = [1_000_000, 1_000_001];
      let ap = aps[0]

      //Miner 1 at mine 1
      if (dataArry[0] === "1") {
        Id = devices[0]
        saveMeasurement(Id, ap, Data, res);
      }

      //miner 2 at mine 1
      if (dataArry[1] === "1") {
        Id = devices[1]
        ap = aps[0]
        saveMeasurement(Id, ap, Data, res);
      }

      //miner 1 at mine 2
      if (dataArry[2] === "1") {
        Id = devices[1]
        saveMeasurement(Id, ap, Data, res);
      }

      //miner 2 at mine 2
      if (dataArry[3] === "1") {
        Id = devices[1]
        ap = aps[1]
        saveMeasurement(Id, ap, Data, res);
      }
    }
  )
);

module.exports = router;

const saveMeasurement = (Id, ap, Data, res) => {
  db.execute(`
  SELECT 
    (SELECT id FROM sensors WHERE device_id = ?) AS sensor_id,
    (SELECT ap.name FROM access_points ap INNER JOIN areas ar ON ap.area_id = ar.id WHERE ap.id = ?) AS access_point_name;
  `,
    [Id, ap],
    (err, dbResults) => {
      if (err) {
        return console.log("Sensor select: ", err);
      }

      db.execute(`
        INSERT INTO measurements( 
          sensor_id, 
          access_point_id, 
          location, 
          other_data
        )VALUES(
          ?, 
          ?, 
          ?, 
          ?
        );`,
        [dbResults[0].sensor_id, ap, dbResults[0].access_point_name, Data],
        (err, dbResults2) => {
          if (err) {
            return console.log(" INSERT INTO measurements: ", err);
          }

          //console.log("New measurement: ", dbResults2.insertId);
          respond(res)
        })
    })
}


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

const respond = (res) => {
  db.execute(query, [], expressAsyncHandler((err, dbResults2) => {
    if (err) {
      //Add to error queue
      return res.status(500)
    }

    const access_points = dbResults2[0].areas.map(area => {
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


    // for (let index = 0; index < access_points.length; index++) {
    //   for (let index_inner = 0; index_inner < uniqueArray.length; index_inner++) {
    //     if (access_points[index].access_point_id === uniqueArray[index_inner].access_point_id) {
    //       if (access_points[index].measurements) {
    //         console.log(access_points[index].access_point_id)
    //       }
    //     }
    //   }
    // }


    // console.log(uniqueArray);
    centralEmitter.emit(serverEvents.NEW_MEASUREMENT, uniqueArray);

    res.status(200).json()
  }))
}