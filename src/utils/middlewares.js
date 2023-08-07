const { validationResult } = require("express-validator");
const expressAsyncHandler = require("express-async-handler");

const IS_DEV = process.env.IS_DEV === "true";

const validationErrorMiddleware = expressAsyncHandler(
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (IS_DEV) {
                console.log("Validation errors: ", errors.array());
            }

            return res.status(400).json({ message: "Missing or invalid fields", data: errors.array() });
        }
        next();
    })

module.exports = { validationErrorMiddleware };