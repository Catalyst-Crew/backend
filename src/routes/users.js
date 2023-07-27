
const { Router } = require('express');
const expressAsyncHandler = require('express-async-handler');
const { check, validationResult, matchedData } = require("express-validator");

const { addLogToQueue } = require('../utils/logs');
const { db, getTimestamp } = require('../utils/database');

const route = Router();

route.put('/:id',
    check(["id", "access", "areaId", "user", "role"]).notEmpty().escape().withMessage("Please make sure all fields are present"),
    (req, res, next) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ message: "Missing or invalid fields", data: result.array() });
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
                    return res.status(500).json({ message: "User not found", error: process.env.IS_DEV === "true" ? err : 1 });
                }

                addLogToQueue(id, "User", `User ${id} updated by ${user}`);

                if (dbResults.affectedRows) {
                    addLogToQueue(id, "User", `User updated successfully by ${user} at ${getTimestamp()} with id ${id} and role ${role} and access ${access} and areaId ${areaId}`);

                    return res.status(200).json({ message: "User updated successfully" });
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
                    return res.status(200).json({ message: "Users found", data: dbResults });
                }

                res.status(404).json({ message: "No users found" });
            }
        )
    })
)

//get all users
route.get('/supervisors',
    expressAsyncHandler(async (_, res) => {
        db.execute(`
            SELECT
                id,
                name
            FROM
                users
            WHERE
                role = 'supervisor' AND access = 'granted';
        `, (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: process.env.IS_DEV === "true" ? err : 1 });
            }

            if (dbResults.length) {
                return res.status(200).json({ message: "Users found", data: dbResults });
            }

            res.status(202).json({ message: "No supervisors found" });
        }
        )
    })
)

module.exports = route;