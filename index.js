require("dotenv").config();
const cors = require("cors");
const http = require('http');
const logger = require('morgan')
const express = require("express");
const trycatch = require("trycatch");
const { Server } = require("socket.io");
const { fork } = require('child_process');

const { addLogToQueue } = require("./src/utils/logs");
const { db, redisDb } = require("./src/utils/database");
const { getLineFromError } = require("./src/utils/functions");

//Routes
const logs = require("./src/routes/log");
const auth = require("./src/routes/auth");
const users = require("./src/routes/users");
const areas = require("./src/routes/areas");
const miners = require("./src/routes/miners");
const sensors = require("./src/routes/sensors");
const reports = require("./src/routes/reports");
const settings = require("./src/routes/settings");
const dasboard = require("./src/routes/dashboard");
const centralEmitter = require("./src/utils/events");
const measurements = require("./src/routes/measurements");
const accessPoints = require("./src/routes/accessPoints");


const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
//Apply Midllewares
app.enable("trust proxy");
app.use([
    express.json(),
    cors({
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
]);
app.use(logger(process.env.IS_DEV === "true" ? "dev" : "combined"))

// //Connect to Db
const isDev = process.env.IS_DEV === "true";

if (!isDev) {
    db.getConnection((err) => {
        if (err) throw err;
        redisDb.connect()
    })
}

//Routes here
app.use("/auth", auth);
app.use("/logs", logs);
app.use("/areas", areas);
app.use("/users", users);
app.use("/miners", miners);
app.use("/sensors", sensors);
app.use("/reports", reports);
app.use("/settings", settings);
app.use("/dashboard", dasboard);
app.use("/measurements", measurements);
app.use("/access-points", accessPoints);
app.all("/", (_, res) => {
    res.send("OK");
});

//Error handler
app.use((err, _, res, __) => {
    res.status(500).send({ message: "Something went wrong" });
    const at = getLineFromError(err)
    if (isDev) {
        trycatch(() => console.log(err.message), (err) => console.log(err.message));
    } else {
        trycatch(() => addLogToQueue(999_999, "Server", `${err.message} ${at}`), (err) => console.log(err.message));
    }
});

//Start the server
trycatch(() => (server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
})), (err) => {
    app.use((_, res) => {
        if (!isDev) {
            const at = getLineFromError(err)
            addLogToQueue(999_999, "Server", err.message + " " + at);
        }
        res.status(500).send({ message: "Something went wrong" });
    });
});

io.on('connection', (socket) => {

    centralEmitter.on('miner_update', () => {
        socket.broadcast.emit('miner_update', 'miner update');
    });

    centralEmitter.on('new_alert', (data) => {
        socket.broadcast.emit('new_alert', data);
    });


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

// create a child process to run cron jobs
//fork('./src/utils/cron-child.js');