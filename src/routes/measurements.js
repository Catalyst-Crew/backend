const { Router } = require('express');
const expressAsyncHandler = require('express-async-handler');

const { db } = require('../utils/database');
const { verifyToken } = require('../utils/tokens');
const { validationErrorMiddleware } = require('../utils/middlewares');

const ENV = process.env.IS_DEV === "true";

const router = Router();

router.get('/iot-data', (req, res) => {
  // Retrieve query parameters from the request
  const id = req.query.Id;
  const pass = req.query.Pass;
  const data = req.query.Data;


  // Process the data as needed
  // In this example, we're just sending back a simple response
  const responseMessage = `Received data: Id=${id}, Pass=${pass}, Data=${data}`;

  console.log(responseMessage);
  
  // Send the response
  res.send(responseMessage);
});

module.exports = router;