const { Router } = require('express');
const { check, matchedData } = require("express-validator");
const expressAsyncHandler = require('express-async-handler');

const { verifyToken } = require('../utils/tokens');
const { addLogToQueue } = require('../utils/logs');
const { db, getNewID, getTimestamp } = require('../utils/database');
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
            miners.id,
            miners.name,
            miners.shift,
            miners.sensorsid,
            miners.created_by,
            miners.updated_by,
            miners.last_updated,
            miners.created,
            miners.email,
            users.name AS supervisor_name,
            users.id AS supervisor_id
        FROM
            miners
        INNER JOIN
            users
        ON
            miners.usersid = users.id
        WHERE
            miners.status != 3;
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
        check('userId', 'UserId creating the employee is required').escape().not().isEmpty(),
        check('username', 'Username creating the employee is required').escape().not().isEmpty()
    ],
    expressAsyncHandler((req, res) => {
        const { name, username, shift, userId, email } = req.body

        const id = getNewID()
        const timestamp = getTimestamp();

        const sqlQuery = `
        INSERT INTO miners
            (id, 
            name,
            shift, 
            created_by, 
            updated_by, 
            last_updated, 
            created, 
            usersid, 
            email) 
            VALUES 
            (?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?);
        `;

        db.execute(sqlQuery, [id, name, shift, username.toLowerCase(), username.toLowerCase(), timestamp, timestamp, userId, email], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            //call the log function
            addLogToQueue(userId, username, `Created a new employee with the name ${name}`)

            res.status(200).json({ message: "Employee added successfully.", data: {} })
        })

    })
)

// update employee
router.put("/:id",
    [
        check('id', 'Miner is required').escape().not().isEmpty(),
        check('shift', 'Shift is required').escape(),
        check('supervisor_id', 'SupervisorId is required').escape(),
        check('sensorsid', 'The new sensor id is required'),
        check('updated_by', 'Name of the user updating the employee is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        let { id, shift, supervisor_id, sensorsid, updated_by } = matchedData(req);

        const sqlQuery = `
        UPDATE
            miners
        SET
            sensorsid = ?,
            updated_by = ?,
            last_updated = ?,
            status = 1,
            shift = ?,
            usersid = ?
        WHERE
            id = ?;
        `
        db.execute(sqlQuery, [sensorsid, updated_by, getTimestamp(), shift, supervisor_id, id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 1 });
            }

            if (sensorsid === null) {
                addLogToQueue(updated_by, updated_by, `Updated the employee with the id ${id} with the sensor id ${sensorsid},  and shift ${shift}, and supervisor id ${supervisor_id}`)
                res.status(200).json({ message: "Employee updated successfully.", data: {} })
            } else {
                //set node to unavailable
                const sqlQuery = `
                    UPDATE
                        sensors
                    SET
                        available = 0
                    WHERE

                        id = ?;
                `
                db.execute(sqlQuery, [sensorsid], (err) => {
                    if (err) {
                        return res.status(500).json({ error: ENV ? err : 1 });
                    }
                    //call the log function
                    addLogToQueue(updated_by, updated_by, `Updated the employee with the id ${id} with the sensor id ${sensorsid},  and shift ${shift}, and supervisor id ${supervisor_id}`)

                    res.status(200).json({ message: "Employee assigned sensor successfully.", data: {} })
                })
            }
        })

    })
)

//delete employee
router.delete("/deactivate/:id/:userId",
    [
        check('id', 'Miner is required').escape().not().isEmpty(),
        check('userId', 'UserId is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, userId } = matchedData(req);

        const sqlQuery = `
            UPDATE miners SET
                sensorsid = null, 
                shift = 'none',
                updated_by = ?, 
                last_updated = ?,
                status = 2 
            WHERE
                id = ?;
        `
        db.execute(sqlQuery, [userId, getTimestamp(), id], (err) => {
            if (err) {
                return res.status(500).json({ message: "Cannot perform that action rigth now", error: ENV ? err : 1 });
            }

            //call the log function
            addLogToQueue(userId, userId, `Deactivated the employee with the id ${id}`)

            res.status(200).json({ message: "User deactivate successfully.", data: {} })
        })

    })
)
//delete employee
router.delete("/delete/:id/:userId",
    [
        check('id', 'Miner is required').escape().not().isEmpty(),
        check('userId', 'UserId is required').escape().not().isEmpty()
    ],
    validationErrorMiddleware,
    expressAsyncHandler((req, res) => {
        const { id, userId } = matchedData(req);

        const sqlQuery = `
            UPDATE miners SET
                sensorsid = null, 
                shift = 'none',
                updated_by = ?, 
                last_updated = ?,
                status = 3 
            WHERE
                id = ?;
        `
        db.execute(sqlQuery, [userId, getTimestamp(), id], (err) => {
            if (err) {
                return res.status(500).json({ message: "Cannot perform that action rigth now", error: ENV ? err : 1 });
            }

            //call the log function
            addLogToQueue(userId, userId, `Deleted the employee with the id ${id}`)

            res.status(200).json({ message: "User deleted successfully.", data: {} })
        })

    })
)

module.exports = router;