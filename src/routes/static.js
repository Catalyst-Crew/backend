const fs = require("node:fs");
const path = require("node:path");
const { Router } = require('express');
const { matchedData, check } = require('express-validator');
const expressAsyncHandler = require('express-async-handler');
const { validationErrorMiddleware } = require('../utils/middlewares');

const router = Router()

router.get("/:file_name",
    check('file_name', "file id is required to get the file").escape().notEmpty(),
    validationErrorMiddleware,
    expressAsyncHandler(
        async (req, res) => {
            const { file_name } = matchedData(req);

            const filePath = path.join(__dirname, `../static/${file_name}`);

            if (fs.existsSync(filePath)) {
                res.sendFile(filePath, expressAsyncHandler(async (err) => {
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

module.exports = router;