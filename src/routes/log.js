const fs = require('fs');
const path = require('path');
const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

const { verifyToken } = require('../utils/tokens');
const { addLogToQueue, addReportToQueue } = require('../utils/logs');
const { db, getTimestamp } = require('../utils/database');
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

router.get('/', expressAsyncHandler(async (_, res) => {
    db.query(`SELECT * FROM logs ORDER BY created_at DESC;`,
        (err, result) => {
            if (err) {
                res.status(500).send({ message: err.message })
            }

            res.status(200).send(result)
        })
}));

router.post(
    '/:id',
    [
        check('id', "userId is required to get the logs").escape().notEmpty().toInt(),
        check('selection', "Not a valid array e.g: [1,2,3] or []").isArray(),
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        try {
            const { id, selection } = matchedData(req);

            const logs = await retrieveLogs();

            let filteredLogs = [];

            filteredLogs = selection.length > 0 ? logs.filter(log => selection.includes(log.id)) : logs;

            if (filteredLogs.length > 0) {
                const docsDir = path.join(__dirname, '../docs');
                if (!fs.existsSync(docsDir)) {
                    fs.mkdirSync(docsDir);
                }

                const logFileName = `log-export-${id}-${Date.now()}.csv`;
                const filePath = path.join(__dirname, `../docs/${logFileName}`);

                const csvWriter = createObjectCsvWriter({
                    path: filePath,
                    header: [
                        { id: 'id', title: 'ID' },
                        { id: 'id_prefix', title: 'ID prefix' },
                        { id: 'loger_id', title: 'Generatee_Id' },
                        { id: 'loger_name', title: 'Generatee_Name' },
                        { id: 'created_at', title: 'Created_At' },
                        { id: 'message', title: 'Message' },
                    ],
                    recordDelimiter: '\r\n',
                });

                await new Promise((resolve, reject) => {
                    csvWriter.writeRecords(filteredLogs)
                        .then(() => resolve())
                        .catch(err => reject(err));
                });

                res.download(filePath, expressAsyncHandler(async (err) => {
                    if (err) {
                        return res.status(500).send({ message: "Can not perform that action right now #1", data: err.message });
                    }

                    addLogToQueue(id, "Logs", `Downloaded ${filteredLogs.length} logs on ${getTimestamp()}`);

                    addReportToQueue(id, logFileName)

                }));

            } else {
                return res.status(404).send({ message: "No logs found" });
            }
        } catch (err) {
            return res.status(500).send({ message: "Error processing request", error: err.message });
        }
    })
);

router.get("/:file_name",
    check('file_name', "file id is required to get the document").escape().notEmpty(),
    validationErrorMiddleware,
    expressAsyncHandler(
        async (req, res) => {
            const { file_name } = matchedData(req);

            const filePath = path.join(__dirname, `../docs/${file_name}`);

            if (fs.existsSync(filePath)) {
                res.download(filePath, expressAsyncHandler(async (err) => {
                    if (err) {
                        return res.status(500).send({ message: "Can not perform that action right now #1", data: err.message });
                    }
                }));
            } else {
                return res.status(404).send({ message: "File not found" });
            }
        }
    )
);

async function retrieveLogs() {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM logs', (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports = router;







