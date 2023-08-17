const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
const { validationErrorMiddleware } = require('../utils/middlewares');

const ENV = process.env.IS_DEV === "true";

const router = Router();

router.use(expressAsyncHandler(async (req, res, next) => {
    if (!ENV) {
        verifyToken(req, res, next); //uncomment in production
    }

    if (ENV) {
        next() //Remove this on production
    }
}))

//get all employees
router.get('/',
    expressAsyncHandler((_, res) => {
        const sqlQuery = `
            SELECT
                m.id AS id,
                m.id_prefix AS id_prefix,
                m.name AS user_name,
                m.email AS email,
                m.status AS status,
                m.created_at AS created_at,
                m.created_by AS created_by,
                m.updated_at AS updated_at,
                m.updated_by AS updated_by,
                m.user_id AS supervisor_id,
                m.shift_id AS shift_id,
                m.sensor_id AS sensor_id,
                u.name AS supervisor_name,
                s.name AS shift_name
            FROM
                miners m
            INNER JOIN
                users u ON m.user_id = u.id
            INNER JOIN
                shifts s ON m.shift_id = s.id
            WHERE
                m.status != 3
            ORDER BY
                m.updated_at
            DESC;
        `;
        db.execute(sqlQuery, [], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            res.status(200).json({ message: "Employees fetched successfully.", data: dbResults })
        })
    })
)

// POST /create new employe
router.post('/create',
    [
        check('name', 'Name is required').escape().not().isEmpty(),
        check('shift', 'Shift is not valid').escape().not().isEmpty(),
        check('email', 'Email is required').escape().isEmail(),
        check('userId', 'UserId creating the employee is required').not().isEmpty().toInt(),
        check('username', 'Username creating the employee is required').escape().not().isEmpty()
    ],
    expressAsyncHandler((req, res) => {
        const { name, username, shift, userId, email } = matchedData(req);

        db.execute(`
            INSERT INTO miners(
                name, 
                email, 
                created_by, 
                user_id, 
                shift_id
                ) 
            VALUES(
                ?, 
                ?, 
                ?, 
                ?, 
                ?
                );
            `,
            [name, email, username, userId, shift], (err, dbResults) => {
                if (err, dbResults) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.affectedRows === 0) {
                    return res.status(500).json({ message: "Failed creating new employee, please try again.", error: ENV ? err : 1 });
                }

                addLogToQueue(dbResults.insertId, username, `Employee created successfully by ${username} with id ${dbResults.insertId} and name ${name} and shift ${shift} and email ${email}`);

                res.status(200).json({ message: "Employee added successfully.", data: {} })
            }
        )
    })
)

// update employee and add node
router.put("/:id",
    [
        check('id', 'Miner is required').escape().notEmpty().toInt(),
        check('shift', 'Shift is required').escape().toInt(),
        check('supervisor_id', 'SupervisorId is required').escape().toInt(),
        check('sensorsid', 'The new sensor id is required').toInt(),
        check('updated_by', 'Name of the user updating the employee is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        let { id, shift, supervisor_id, sensorsid, updated_by } = matchedData(req);

        const sensor_id = sensorsid ? sensorsid : null;

        console.log("sensor_id: ", sensor_id);

        db.execute(`
            UPDATE miners SET 
                status = 1,  
                updated_by = ?, 
                user_id = ?, 
                shift_id = ?, 
                sensor_id = ? 
            WHERE
                id = ?;
        `, [updated_by, supervisor_id, shift, sensor_id, id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (sensorsid === NaN || sensorsid === null || sensorsid === undefined || sensorsid === 0 || !sensorsid) {
                if (dbResults.affectedRows === 0) {
                    return res.status(500).json({ message: "Failed updating employee, please try again.", error: ENV ? err : 1 });
                }

                addLogToQueue(id, updated_by, `Updated the employee with the id ${id} with shift ${shift}, and supervisor id ${supervisor_id}`)
                res.status(200).json({ message: "Employee updated successfully.", data: {} })
                return;
            }

            //set node to unavailable
            db.execute(`
                UPDATE
                    sensors
                SET
                    available = 0
                WHERE
                    id = ?;
                `,
                [sensorsid], (err, dbResults) => {
                    if (err) {
                        return res.status(500).json({ error: ENV ? err : 1 });
                    }

                    if (dbResults.affectedRows === 0) {
                        return res.status(500).json({ message: "Failed updating employee, please try again.", error: ENV ? err : 1 });
                    }

                    addLogToQueue(id, updated_by, `Employee updated successfully by ${updated_by}  with id ${id} and shift ${shift} and supervisor_id ${supervisor_id} and sensorsid ${sensorsid}`);

                    res.status(200).json({ message: "Employee updated successfully.", data: {} })
                }
            )
        })
    })
)

//delete employee
router.delete("/deactivate/:id/:userId",
    [
        check('id', 'Miner is required').not().isEmpty().isNumeric().toInt(),
        check('userId', 'UserId is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, userId } = matchedData(req);

        //get the sensor id
        db.execute(`
            SELECT
                sensor_id
            FROM
                miners
            WHERE
                id = ?;
            `,
            [id], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.length !== 0) {
                    db.execute(`
                        UPDATE miners SET
                            sensor_id = null, 
                            shift = 1000003,
                            updated_by = ?, 
                            status = 2 
                        WHERE
                            id = ?;
                        `,
                        [userId, id], (err, dbResults) => {
                            if (err) {
                                return res.status(500).json({ message: "Cannot perform that action rigth now", error: ENV ? err : 1 });
                            }

                            if (dbResults.affectedRows === 0) {
                                return res.status(500).json({ message: "Failed deactivating employee, please try again.", error: ENV ? err : 1 });
                            }

                            //set node to available
                            db.execute(`
                                UPDATE
                                    sensors
                                SET
                                    available = 1
                                WHERE
                                    id = ?;
                                `,
                                [sensorsid], (err, dbResults) => {
                                    if (err) {
                                        return res.status(500).json({ error: ENV ? err : 1 });
                                    }

                                    if (dbResults.affectedRows === 0) {
                                        return res.status(500).json({ message: "Failed updating employee, please try again.", error: ENV ? err : 1 });
                                    }

                                    addLogToQueue(id, updated_by, `Employee updated successfully by ${updated_by}  with id ${id} and shift ${shift} and supervisor_id ${supervisor_id} and sensorsid ${sensorsid}`);

                                    return res.status(200).json({ message: "Employee updated successfully.", data: {} })
                                }
                            )
                        }
                    )
                    return;
                }
                addLogToQueue(id, userId, `Employee deactivated successfully by ${userId} with id ${id}`);
                return res.status(200).json({ message: "User deactivate successfully.", data: {} })
            }
        )
    })
)

//delete employee
router.delete("/delete/:id/:userId",
    [
        check('id', 'Miner is required').escape().notEmpty().toInt(),
        check('userId', 'UserId is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, userId } = matchedData(req);

        //get the sensor id
        db.execute(`
            SELECT
                sensor_id
            FROM
                miners
            WHERE
                id = ?;
            `,
            [id], (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: ENV ? err : 1 });
                }

                if (dbResults.length !== 0) {
                    db.execute(`
                        UPDATE miners SET
                            sensor_id = null, 
                            shift = 1000003,
                            updated_by = ?, 
                            status = 3 
                        WHERE
                            id = ?;
                        `,
                        [userId, id], (err, dbResults) => {
                            if (err) {
                                return res.status(500).json({ message: "Cannot perform that action rigth now", error: ENV ? err : 1 });
                            }

                            if (dbResults.affectedRows === 0) {
                                return res.status(500).json({ message: "Failed deactivating employee, please try again.", error: ENV ? err : 1 });
                            }

                            //set node to available
                            db.execute(`
                                UPDATE
                                    sensors
                                SET
                                    available = 1
                                WHERE
                                    id = ?;
                                `,
                                [sensorsid], (err, dbResults) => {
                                    if (err) {
                                        return res.status(500).json({ error: ENV ? err : 1 });
                                    }

                                    if (dbResults.affectedRows === 0) {
                                        return res.status(500).json({ message: "Failed updating employee, please try again.", error: ENV ? err : 1 });
                                    }

                                    addLogToQueue(id, updated_by, `Employee updated successfully by ${updated_by}  with id ${id} and shift ${shift} and supervisor_id ${supervisor_id} and sensorsid ${sensorsid}`);

                                    return res.status(200).json({ message: "Employee updated successfully.", data: {} })
                                }
                            )
                        }
                    )
                    return;
                }
                addLogToQueue(id, userId, `Employee deactivated successfully by ${userId} with id ${id}`);
                return res.status(200).json({ message: "User deactivate successfully.", data: {} })
            }
        )
    })
)

module.exports = router;