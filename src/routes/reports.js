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
        console.log(`$ Error while fetching old measurment records`);
        console.error(err);
        //addLogToQueue(999_999, "Cron Job", "Failed to generate logs with error: "+ JSON.stringify({ err }))
        return
      }

      const filePath = path.join(__dirname, `../docs/measurement-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new measurements report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for measurement with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};

//function to generate a report for the logs table

function generateLogs() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        log
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old Log records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/log-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new log report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for log with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 





//Generate a report for the reports

function generateReport() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        reports
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old reports records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/log-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new Report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for reports with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 


//Generate a report for users table

function generateUsersReport() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        users
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old user table records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/users-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Users", "Failed to generate a new users report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for users table with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 


//Generate a report for the areas table

function generateAreas() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        areas
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old areas records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/areas-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new areas report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for areas with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 
//generate a report for sensors table
function generateSensorsTable() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        sensors
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old sensors records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/sensors-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new sensors report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for sensors with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 
//generate a report for the report
function generateReportforReport() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        reports
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old report records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/reports-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for report with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 
//generate a report for report settings
function generateReportSettings() {
  const currentDate = new Date("2023-08-14T08:15:52.000Z");

  db.execute(
    `
      SELECT
        id, id_prefix,
        sensor_id,
        access_point_id, 
        created_at,
        location, 
        other_data 
      FROM
        settings
      WHERE
        DATE(created_at) = DATE(?)
      ;
    `,
    [currentDate], expressAsyncHandler(async (err, data) => {
      if (err) {
        console.log(`$ Error while fetching old report settings records`);
        console.error(err);
        /*addLogToQueue(999_999,
         "Cron Job",
         "Failed to generate logs with error:
         "+ JSON.stringify({ err }))*/
        return
      }

      const filePath = path.join(__dirname, `../docs/settings-${Date.now()}.csv`);

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
            [999_999, filePath], (err, dbResults) => {
              if (err) {
                addLogToQueue(999_999, "Reports", "Failed to generate a new settings report. Data: " + JSON.stringify(err))
                return;
              }
              addLogToQueue(999_999, "Reports", "New report genetated for report settings with id " + dbResults.insertId)
            }
          )
        }
      ).catch(err => console.error(err));

      return;
    })
  )
};
 





module.exports = router