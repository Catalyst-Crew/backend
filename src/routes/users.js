
const { Router } = require('express')
const expressAsyncHandler = require('express-async-handler')
const { check, validationResult } = require("express-validator")
const { db, getTimestamp } = require('../utils/database')

const route = Router();


//route to chang user acces status
route.post('/access',
    check(["userId", "status", "user"]),
    (req, res, next) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.send({ massage: "Missing or invalid fields", data: result.array() });
        }
        next();
    },
    expressAsyncHandler(async (req, res) => {
        const { userId, status, user } = req.body;

        db.execute(`
            UPDATE
                users
                SET
                updated_by = ?,
                last_updated = ?,
                access = ?
                WHERE
                id = ?;`,
            [user, getTimestamp(), status, userId],
            (err, dbResults) => {
                if (err){
                    return res.status(500).json({ error: process.env.IS_DEV === "true" ? err : 01 });
                }

                if (dbResults.affectedRows){
                    return res.status(200).json({ massage: "User access status updated" });
                }
            })


    })
)















module.exports = route;