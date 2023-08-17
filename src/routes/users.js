
const { Router } = require('express');
const expressAsyncHandler = require('express-async-handler');
const { check, validationResult, matchedData } = require("express-validator");

const { db } = require('../utils/database');
const { addLogToQueue } = require('../utils/logs');
const { validationErrorMiddleware } = require('../utils/middlewares');

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
            `UPDATE 
                users 
            SET 
                access_id = ?, 
                area_id = ?,
                updated_by = ?, 
                user_role_id = ? 
            WHERE
                id = ?;`,
            [parseInt(access), parseInt(areaId), user, parseInt(role), parseInt(id)],
            (err, dbResults) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: "User not found", error: process.env.IS_DEV === "true" ? err : 1 });
                }

                if (dbResults.affectedRows) {
                    addLogToQueue(id, "User", `User updated successfully by ${user} with id ${id} and role ${role} and access ${access} and areaId ${areaId}`);
                }

                return res.status(200).json({ message: "User updated successfully" });
            }
        )
    })
)

//get all users
route.get('/',
    expressAsyncHandler(async (_, res) => {
        db.execute(`
            SELECT 
                u.id AS user_id,
                u.id_prefix AS user_id_prefix,
                u.name AS user_name,
                ur.id AS role_id,
                ur.name AS role_name,
                u.email,
                u.created_by,
                u.created_at,
                u.updated_by,
                u.updated_at,
                a.id AS access_id,
                a.name AS access_name,
                u.area_id,
                ar.name AS area_name
            FROM 
                users u
            INNER JOIN 
                user_roles ur ON u.user_role_id = ur.id
            INNER JOIN 
                access a ON u.access_id = a.id
            INNER JOIN
                areas ar ON u.area_id = ar.id 
            WHERE
                u.access_id != 1000003 
            ;`,
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

//get all supervisors
route.get('/supervisors',
    expressAsyncHandler(async (_, res) => {
        db.execute(`
            SELECT 
                u.id AS user_id,
                u.id_prefix AS user_id_prefix,
                u.name AS user_name,
                ur.name AS role_name,
                ur.id AS role_id
            FROM 
                users u
            INNER JOIN 
                user_roles ur ON u.user_role_id = ur.id
            WHERE 
                ur.id = 1000001;
      
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


//update a user
route.put('/update/:id',
    check(["id", "name", "phone"]).escape().notEmpty().withMessage("Please make sure all fields are present"),
    validationErrorMiddleware,
    expressAsyncHandler(async (req, res) => {
        const { id, name, phone } = matchedData(req);

        db.execute(
            `UPDATE
                users
            SET
                name = ?,
                phone = ?
            WHERE
                id = ?;`,
            [name, phone, parseInt(id)],
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ message: "User not found", error: process.env.IS_DEV === "true" ? err : 1 });
                }

                if (dbResults.affectedRows) {
                    addLogToQueue(id, "User", `User updated successfully by ${name} with id ${id} and phone ${phone}`);
                }

                return res.status(200).json({ message: "User updated successfully" });
            }
        )
    })
)

module.exports = route;