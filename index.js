require("dotenv").config();
const cors = require("cors");
const logger = require('morgan')
const express = require("express");

const { db } = require("./src/utils/database");

//Routes
const logs = require("./src/routes/log");
const auth = require("./src/routes/auth");
const users = require("./src/routes/users");
const miners = require("./src/routes/miners");
const sensors = require("./src/routes/sensors");
const settings = require("./src/routes/settings");

const { worker } = require("./src/utils/logs"); //do not remove this line it does something I don't know how

const app = express();
const PORT = process.env.PORT | 3000;

//Apply Midllewares
app.enable("trust proxy");
app.use([
    express.json(),
    cors(),
    //express.urlencoded({ extended: true })
]);
app.use(logger(process.env.IS_DEV === "true" ? "dev" : "combined"))

// //Connect to Db
const isDev = process.env.IS_DEV === "true" ? true : false;

if (!isDev) {
    db.getConnection((err) => {
        if (err) throw err;
        //console.log("Database Connected");
    })
}

//Routes here
app.use("/sensors", sensors);
app.use("/miners", miners);
app.use("/users", users);
app.use("/logs", logs);
app.use("/auth", auth);
app.use("/settings", settings);
app.all("/", (_, res) => {
    res.send();
});

//Error handler
app.use((err, req, res, next) => {
    res.status(500).send({ massage: "Something went wrong" });
    console.log(err);
});

//Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});