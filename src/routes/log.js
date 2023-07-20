const fs = require('fs');
const path = require('path');
const { Router } = require('express');
const { createObjectCsvWriter } = require('csv-writer');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
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
    db.query(`SELECT * FROM logs ORDER BY timestamp DESC;`,
        (err, result) => {
            if (err) {
                res.status(500).send({ message: err.message })
            }

            res.status(200).send(result)
        })
}))

router.post('/:id',
    [
        check('id', "userId is required to get the logs").escape().notEmpty(),
        check('selection', "Not a valid array e.g: [1,2,3] or []").isArray()
    ],
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, selection } = matchedData(req);
        db.query(`
            SELECT 
                * 
            FROM 
                logs 
        `, (err, result) => {
            if (err) {
                res.status(500).send({ message: err.message })
            }

            let logs = []

            logs = selection.length > 0 ? result.filter(log => selection.includes(log.id)) : result;

            if (logs.length > 0) {
                const filePath = path.join(__dirname, `../logs/log-export-${id}-${Date.now()}.csv`)

                const csvWriter = createObjectCsvWriter({
                    path: filePath,
                    header: [
                        { id: 'id', title: 'ID' },
                        { id: 'generatee_id', title: 'Generatee_Id' },
                        { id: 'generatee_name', title: 'Generatee_Name' },
                        { id: 'timestamp', title: 'Created_At' },
                        { id: 'massage', title: 'Message' },
                    ],
                    recordDelimiter: '\r\n'
                });

                csvWriter.writeRecords(logs)
                    .then(() => {
                        res.download(filePath, (err) => {
                            if (err) {
                                return res.status(500).send({ message: err.message })
                            }

                            addLogToQueue(id, "Logs", `Downloaded ${logs.length} logs on ${getTimestamp()}`)

                            fs.unlinkSync(filePath)  //delete file
                        })
                    });
                return;
            }
            res.status(404).send({ message: "No logs found" })
        })
    })
)

module.exports = router