
const { Router } = require('express')
const expressAsyncHandler = require('express-async-handler')
const { check, validationResult, matchedData } = require("express-validator")

const { db, getTimestamp } = require('../utils/database')

const route = Router();

route.post('/:id',
    check(["id", "access", "areaId", "user", "role"]).notEmpty().escape().withMessage("Please make sure all fields are present"),
    (req, res, next) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.send({ massage: "Missing or invalid fields", data: result.array() });
        }
        next();
    },
    expressAsyncHandler(async (req, res) => {
        const { id, access, areaId, user, role } = matchedData(req);

        db.execute(
            `UPDATE users 
                SET 
                access = ?, 
                areasid = ?, 
                updated_by = ?, 
                role = ?, 
                last_updated = ? 
            WHERE id = ?;`,
            [access, areaId, user, role, getTimestamp(), id],
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({massage: "User not found", error: process.env.IS_DEV === "true" ? err : 1 });
                }

                if (dbResults.affectedRows) {
                    console.log(dbResults);
                    return res.status(200).json({ massage: "User updated successfully" });
                }

            }
        )
    })
)

//get all users
route.get('/',
    expressAsyncHandler(async (_, res) => {
        db.execute(`
        SELECT
            users.id,
            users.name,
            users.role,
            users.email,
            users.created_by,
            users.updated_by,
            users.last_updated,
            users.created,
            users.access,
            areas.name AS area,
            areas.id AS areaId
        FROM
            users
        LEFT JOIN areas ON users.areasid = areas.id;`,
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: process.env.IS_DEV === "true" ? err : 1 });
                }

                if (dbResults.length) {
                    return res.status(200).json({ massage: "Users found", data: dbResults });
                }

                res.status(404).json({ massage: "No users found" });
            }
        )
    })
)
















module.exports = route;