const { Router } = require('express');
const { serverAdapter } = require('../utils/logs');
const { queuePassValidation } = require('../utils/middlewares');


const router = Router()

router.use("/queues/:pass",
    queuePassValidation,
    serverAdapter.getRouter()
);

module.exports = router;