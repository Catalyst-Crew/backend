const { Router } = require('express')
const expressAsyncHandler = require('express-async-handler')
const { check, validationResult } = require("express-validator")
const { db, getTimestamp } = require('../utils/database')

const router = Router();

//route to chang user acces status
router.post('/access',
    check(["userId", "status", "user"]).notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next()
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
                if (err) {
                    return res.status(500).json({ error: process.env.IS_DEV === "true" ? err : 01 });
                }

                if (dbResults.
                    affectedRows) {
                    return res.status(200).json({ massage: "User access status updated" });
                }
            }
        )
    }
    )
)

//route to chang user access level
router.post('/level',
    check(["userId", "status", "user"]).notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        next()
    },
    expressAsyncHandler(async (req, res) => {
        const { userId, status, user } = req.body;

        db.execute(`
        UPDATE
            users
            SET

            role = ?,
            
            updated_by = ?,
            last_updated = ?,
            created = ?,
            access = ?,
            WHERE
            id = ?;`,
            [user, getTimestamp(), status, userId],
            (err, dbResults) => {
                if (err) {
                    return res.status(500).json({ error: process.env.IS_DEV === "true" ? err : 01 });
                }

                if (dbResults.
                    affectedRows) {
                    return res.status(200).json({ massage: "User access level status updated" });
                }
            }
        )
    }
    )
)

/*route to delete user
router.delete('/:id',check(["userId", "status"]).notEmpty(),
(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({ errors: errors.array() });
    }
    next()
},
expressAsyncHandler(async (req, res) => {
    const { userId, status} = req.body;

    db.execute(
        DELETE
        name = ?,
        role = ?,
        email = ?,
        password = ?,
        created_by = ?,
        updated_by = ?,
        last_updated = ?,
        created = ?,
        access = ?,
        areasid = ?
        FROM
        id=?
        [user, getTimestamp(), status, userId],
        (err, dbResults) => {
            if (err) {
                return res.status(500).json({ error: process.env.IS_DEV === "true" ? err : 01 });
            }

            if (dbResults.
                affectedRows) {
                return res.status(200).json({ massage: "User access status updated" });
            }
        }
    )
}
)
)*/







module.exports = router
