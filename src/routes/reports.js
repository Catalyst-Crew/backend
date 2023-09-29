const fs = require('fs');
const path = require('path');
const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');


const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { validationErrorMiddleware } = require('../utils/middlewares');
const { addGeneratJob, addToQueue, queueNames } = require('../utils/logs');

const router = Router();
const ENV = process.env.IS_DEV === "true";

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
);

router.use(expressAsyncHandler(async (req, res, next) => {
  if (!ENV) {
    verifyToken(req, res, next); //uncomment in production
  }

  if (ENV) {
    next() //Remove this on production
  }
}
));

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
);

router.post("/:report_type",
  [
    check("user_id").exists().withMessage("User ID is required.").toInt(),
    check("notify_user").exists().withMessage("Notify user is required.").isBoolean().withMessage("Notify user must be a boolean.").toBoolean(),
    check("date_range").isArray().withMessage("Date range must be an array."),
    check("report_type").isIn(["measurements", "access_points", 'miners', 'sensors', 'users', 'reports', 'logs'])
      .withMessage("Report type must be either measurements or access_points. If you want to generate a report for all the tables, use the all keyword.")
  ],
  validationErrorMiddleware,
  expressAsyncHandler(async (req, res) => {
    const { user_id, notify_user } = matchedData(req);

    let notifty_email = ""

    if (notify_user) {
      db.execute(`
        SELECT email FROM users WHERE id = ?;`,
        [user_id],
        (err, dbResults) => {

          if (err) {
            return res.status(500).json({ message: "Error getting current user email" })
          }

          if (dbResults.length === 0) {
            return res.status(404).json({ message: "User not found." });
          }

          const { email } = dbResults[0];
          notifty_email = email;

          addToQueue(queueNames.LOGGER, { generatee_id: user_id, generatee_name: "Reports", massage: `Generating report for user ${email}.` })

          addGeneratJob({ ...matchedData(req), notifty_email })

          return res.status(200).json({ message: "Generating report." })
        }
      )
      return
    }

    addToQueue(queueNames.LOGGER, { generatee_id: user_id, generatee_name: "Reports", massage:  `Generating report for user ${user_id}.`})
    
    return res.status(200).json({ message: "Generating report." })
  })
);

router.post("/upload/new",
  [
    check("user_id").exists().withMessage("User ID is required.").toInt(),
    check("file_name").exists().withMessage("File name is required.").escape(),
    check("file").exists().withMessage("File is required.").escape(),
  ],
  validationErrorMiddleware,
  expressAsyncHandler(async (req, res) => {
    const { user_id, file_name } = matchedData(req);

    const newFileName = `${file_name + Date.now()}.csv`;

    try {
      const filePath = path.join(__dirname, `../docs/${newFileName}`);
      const base64Data = req.body.file;

      const dataWithoutPrefix = base64Data.replace(/^data:\w+\/\w+;base64,/, '');
      const buffer = Buffer.from(dataWithoutPrefix, 'base64');

      fs.writeFileSync(filePath, buffer);

      addToQueue(queueNames.LOGGER, { generatee_id: user_id, generatee_name: "Reports", massage: `New report uploaded with name ${file_name}.` })

      addToQueue(queueNames.REPORT, { logFileName: newFileName, user_id })

      res.status(200).json({ message: 'File saved successfully.', file_path: filePath });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while saving the file.' });
    }
  })
);

module.exports = router;