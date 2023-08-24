require("dotenv").config();
const cors = require("cors");
const http = require('http');
const logger = require('morgan')
const express = require("express");
const { Server } = require("socket.io");

const { db, redisDb } = require("./src/utils/database");

//Routes
const logs = require("./src/routes/log");
const auth = require("./src/routes/auth");
const users = require("./src/routes/users");
const areas = require("./src/routes/areas");
const miners = require("./src/routes/miners");
const sensors = require("./src/routes/sensors");
const settings = require("./src/routes/settings");
const dasboard = require("./src/routes/dashboard");
const accessPoints = require("./src/routes/accessPoints");

const { worker } = require("./src/utils/logs"); //do not remove this line it does something I don't know how

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
//Apply Midllewares
//app.enable("trust proxy");
app.use([
    express.json(),
    cors({
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
]);
app.use(logger(process.env.IS_DEV === "true" ? "dev" : "combined"))

// //Connect to Db
redisDb.connect();
const isDev = process.env.IS_DEV === "true";

if (!isDev) {
    db.getConnection((err) => {
        if (err) throw err;
        console.log("Database Connected");
    })
}

//Routes here
app.use("/sensors", sensors);
app.use("/miners", miners);
app.use("/users", users);
app.use("/logs", logs);
app.use("/auth", auth);
app.use("/areas", areas);
app.use("/settings", settings);
app.use("/access-points", accessPoints);
app.use("/dashboard", dasboard);
app.all("/", (_, res) => {
    res.send("OK");
});

//Error handler
app.use((err, req, res, next) => {
    res.status(500).send({ massage: "Something went wrong" });
    if (isDev) {
        console.log(err);
    }
    return;
});

//Start the server
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});

io.on('connection', (socket) => {
    socket.broadcast.emit('miner_update', 'miner update');
    socket.broadcast.emit('sensor_update', 'sensor update');
    socket.broadcast.emit('area_update', 'area update');
    socket.broadcast.emit('access_point_update', 'access point update');
    console.log('a user connected');
    socket.broadcast.emit('message', 'new_message');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('message', (msg) => {
        console.log('message: ' + msg);

        socket.broadcast.emit('message', msg);

    });


});