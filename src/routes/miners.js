const { Router } = require('express')
const expressAsyncHandler = require('express-async-handler')
const { check, validationResult } = require("express-validator")

//Utils
const { verifyToken } = require('../utils/tokens');
const { db, getNewID, getTimestamp } = require('../utils/database');
const ENV = process.env.IS_DEV === "true";

const router = Router()

// POST /create new employe
router.post('/create',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('shift', 'Shift is not valid').not().isEmpty(),
        check('userId', 'UserId creating the employee is required').not().isEmpty(),
        check('username', 'Username creating the employee is required').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        //verifyToken(req, res, next); //uncomment on production

        //Remove this on production
        next()
    }
    ,
    expressAsyncHandler((req, res) => {
        const { name, username, shift, userId } = req.body

        const id = getNewID()
        const timestamp = getTimestamp();

        const sqlQuery = `
        INSERT INTO
            miners (
                id,
                name,
                usersid,
                sensorsid,
                shift,
                created_by,
                updated_by,
                last_updated,
                created,
                usersid2
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            );`;

        db.execute(sqlQuery, [id, name, userId, "none", shift, username.toLowerCase(), username.toLowerCase(), timestamp, timestamp, userId], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 01 });
            }
            console.log(dbResults);

            res.status(200).json({ massage: "Employee added successfully.", data: {} })
        })

    })
)


// update employee
router.post("/employee",
    [
        check('minerId', 'Miner is required').not().isEmpty(),
        check('username', 'Name of the user updating the employee is required').not().isEmpty(),
        check('sensorId', 'The new sensor id is required').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }
        next()

        //verifyToken(req, res, next)
    },
    expressAsyncHandler((req, res) => {
        const id = req.body.minerId;
        const username = req.body.username;
        const sensorId = req.body.sensorId;

        const sqlQuery = `
        UPDATE
          miners
            SET
          sensorsid = ?,
          updated_by = ?,
          last_updated = ?
            WHERE
          id = ?;
        `
        db.execute(sqlQuery, [sensorId, username, getTimestamp(), id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 01 });
            }

            console.log(dbResults);

            //call the log function

            res.status(200).json({ massage: "Sensor id updated successfully.", data: {} })
        })

    })
)

// update employee
router.post("/update/shift",
    [
        check('minerId', 'Miner is required').not().isEmpty(),
        check('username', 'Name of the user updating the employee is required').not().isEmpty(),
        check('shift', 'The new shift is required').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }
        next()

        //verifyToken(req, res, next)
    },
    expressAsyncHandler((req, res) => {
        const id = req.body.minerId;
        const username = req.body.username;
        const shift = req.body.shift;

        const sqlQuery = `
        UPDATE
          miners
            SET
          shift = ?,
          updated_by = ?,
          last_updated = ?
            WHERE
          id = ?;
        `
        db.execute(sqlQuery, [shift, username, getTimestamp(), id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 01 });
            }

            console.log(dbResults);

            //call the log function

            res.status(200).json({ massage: "Shift updated successfully.", data: {} })
        })

    })
)

//delete employee
router.delete("/update/shift",
    [
        check('minerId', 'Miner is required').not().isEmpty(),
        check('username', 'Name of the user updating the employee is required').not().isEmpty(),
        check('shift', 'The new shift is required').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }
        next()

        //verifyToken(req, res, next)
    },
    expressAsyncHandler((req, res) => {
        const id = req.body.minerId;
        const username = req.body.username;
        const shift = req.body.shift;

        const sqlQuery = `
        UPDATE
          miners
            SET
          shift = ?,
          updated_by = ?,
          last_updated = ?
            WHERE
          id = ?;
        `
        db.execute(sqlQuery, [shift, username, getTimestamp(), id], (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: ENV ? err : 01 });
            }

            console.log(dbResults);

            //call the log function

            res.status(200).json({ massage: "Shift updated successfully.", data: {} })
        })

    })
)
module.exports = router