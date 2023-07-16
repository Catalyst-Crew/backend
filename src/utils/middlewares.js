const { validationResult } = require("express-validator")
const expressAsyncHandler = require("express-async-handler")

const validationErrorMiddleware = expressAsyncHandler(
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array() })
        }
        next()
    })

module.exports = { validationErrorMiddleware }