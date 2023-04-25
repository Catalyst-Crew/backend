const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv").config();

const app = express();
const PORT = 3000 || process.env.PORT;

//Apply Midllewares
app.enable("trust proxy");
app.use([
    express.json(),
    cors(),
    express.urlencoded({ extended: true })
]);

app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});