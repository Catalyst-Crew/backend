const path = require('path');
const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
const { db } = require('../utils/database');
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

router.get("/", generateMeasurments)

function generateMeasurments() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix, sensor_id, access_point_id, created_at, location, other_data 
      FROM
        measurements
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        addLogToQueue(999_999, "Cron Job", `Failed to generate logs with error: ${JSON.stringify(err)}`)
        return
      }

      const logFileName = `measurement-${Date.now()}.csv`;
      const filePath = path.join(__dirname, `../docs/${logFileName}`);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'id_prefix', title: 'ID prefix' },
          { id: 'sensor_id', title: 'Senser ID' },
          { id: 'access_point_id', title: 'AccessPoint ID' },
          { id: 'created_at', title: 'Created_At' },
          { id: 'location', title: 'Location' },
          { id: 'other_data', title: 'Other Data' },
        ],
        recordDelimiter: '\r\n',
      });

      csvWriter.writeRecords(data).then(
        () => {
          db.execute(`
            INSERT INTO reports
              (user_id, file_name) 
            VALUES 
              (?, ?);
          `,
            [999_999, logFileName], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", `Failed to generate a new measurements report. Data: ${JSON.stringify(err)}`)
                return;
              }
              addLogToQueue(999_999, "Reports", `New report genetated for measurement with id ${dbResults.insertId}`)
            }
          )
        }
      ).catch(err => console.error(err));
      return;
    })
  )
};

module.exports = router