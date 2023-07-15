require("dotenv").config();
const cors = require("cors");
const logger = require('morgan')
const express = require("express");

const { db } = require("./src/utils/database");

//Routes
const auth = require("./src/routes/auth");
const users = require("./src/routes/users");

const miners = require("./src/routes/miners");
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
app.use("/auth", auth);
app.use("/miners", miners);
app.use("/users", users);
app.all("/", (_, res) => {
    res.send();
});

//Error handler
app.use((err, req, res, next) => {
    res.status(500).send({ massage: "Something went wrong" });
});

//Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});