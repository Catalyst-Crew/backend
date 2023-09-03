const fs = require('fs');
const path = require('path');
const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { addLogToQueue, addReportToQueue } = require('../utils/logs');
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

<<<<<<< HEAD
router.get("/", generateMeasurments)
router.get("/", generateLogs)
router.get("/", generateReport)
router.get("/", generateReportSettings)
router.get("/", generateReportforReport)
router.get("/", generateSensorsTable)
router.get("/", generateAreas)
router.get("/", generateUsersReport)
=======
router.get("/:file_name",
  check("file_name").exists().withMessage("File name is required."),
  validationErrorMiddleware,
  expressAsyncHandler(async (req, res) => {
    const { file_name } = matchedData(req);

    const filePath = path.join(__dirname, `../docs/${file_name}`);

    if (!fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 1, message: "File not found." });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${file_name}`);
    res.setHeader('Content-Type', 'blob');

    res.download(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: ENV ? err : 1, message: "Failed to download the file." });
      }
    })
  })
)

router.get("/",
  expressAsyncHandler(async (_, res) => {
    db.execute(`
      SELECT
        r.id, r.user_id, r.file_name, r.created_at, u.name
      FROM
        reports r
      INNER JOIN
        users u ON r.user_id = u.id
      ORDER BY
        created_at DESC
      LIMIT 100
      ;`,
      [],
      (err, dbResults) => {
        if (err) {
          return res.status(500).json({ error: ENV ? err : 1 });
        }

        if (dbResults.length === 0) {
          return res.status(202).json({ message: "No reports found." });
        }

        res.status(200).json(dbResults)
      }
    )
  })
)

router.post("/generate",
  [
    check("user_id").exists().withMessage("User ID is required.").toInt(),
    check("notifty_user").exists().withMessage("Notify user is required.").isBoolean().withMessage("Notify user must be a boolean.").toBoolean(),
    check("date_range").isArray().withMessage("Date range must be an array.").isLength({ min: 2, max: 2 }).withMessage("Date range must have 2 values."),
    check("report_type").isIn(["measurements", "access_points", 'miners', 'sensors', 'users', 'reports', 'logs'])
      .withMessage("Report type must be either measurements or access_points. If you want to generate a report for all the tables, use the all keyword.")
  ],
  validationErrorMiddleware,
  expressAsyncHandler(async (req, res) => {
    const { user_id, notifty_user, date_range, report_type } = matchedData(req);

    const notifty_email = ""

    if (notifty_user) {
      const dbResults = db.execute(`SELECT email FROM users WHERE id = ?;`, [user_id])

      dbResults.then(([dbResults, _]) => {
        if (dbResults.length === 0) {
          return res.status(404).json({ message: "User not found." });
        }

        const { email } = dbResults[0];
        notifty_email = email;

        addLogToQueue(user_id, "Reports", `Generating report for user ${email}.`)
      })
    }

    const fromDate = new Date(date_range[0]);
    const toDate = new Date(date_range[1]);

    //add to queue for generating the report

    //addToGenerateQueue(user_id, notifty_email, fromDate, toDate, report_type)

    res.status(200).json({ message: "Generating report." })
  })
)

router.post("/upload",
  [
    check("user_id").exists().withMessage("User ID is required.").toInt(),
    check("file_name").exists().withMessage("File name is required.").escape(),
    check("file").exists().withMessage("File is required.").escape(),
  ],
  validationErrorMiddleware,
  expressAsyncHandler(async (req, res) => {
    const { user_id, file_name, file } = matchedData(req);

    const newFileName = `${file_name + Date.now()}.csv`;

    try {
      const filePath = path.join(__dirname, `../docs/${newFileName}`);
      const base64Data = req.body.file;

      const dataWithoutPrefix = base64Data.replace(/^data:\w+\/\w+;base64,/, '');
      const buffer = Buffer.from(dataWithoutPrefix, 'base64');

      fs.writeFileSync(filePath, buffer);

      addLogToQueue(user_id, "Reports", `New report uploaded with name ${file_name}.`)
      addReportToQueue(user_id, newFileName)

      res.status(200).json({ message: 'File saved successfully.', file_path: filePath });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while saving the file.' });
    }
  })
)
>>>>>>> b6575b197faf02369fa928f4fdfe0404ae018c13

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