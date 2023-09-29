require("dotenv").config();
const cors = require("cors");
const http = require('http');
const logger = require('morgan')
const express = require("express");
const trycatch = require("trycatch");
const { Server } = require("socket.io");
const { fork } = require('child_process');

const { db, redisDb } = require("./src/utils/database");
const { getLineFromError } = require("./src/utils/functions");
const { addToQueue, queueNames } = require("./src/utils/logs");
const { centralEmitter, serverEvents } = require("./src/utils/events");

//Routes
const logs = require("./src/routes/log");
const auth = require("./src/routes/auth");
const users = require("./src/routes/users");
const admin = require("./src/routes/admin");
const areas = require("./src/routes/areas");
const static = require("./src/routes/static");
const alerts = require("./src/routes/alerts");
const miners = require("./src/routes/miners");
const sensors = require("./src/routes/sensors");
const reports = require("./src/routes/reports");
const settings = require("./src/routes/settings");
const dasboard = require("./src/routes/dashboard");
const measurements = require("./src/routes/measurements");
const accessPoints = require("./src/routes/accessPoints");
const announcements = require("./src/routes/announcements");

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
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
]);
app.use(logger("short"))

// //Connect to Db
const isDev = process.env.IS_DEV === "true";

db.getConnection((err) => {
    if (err) throw err;
    redisDb.connect()
})


//Routes here
app.use("/auth", auth);
app.use("/logs", logs);
app.use("/areas", areas);
app.use("/admin", admin);
app.use("/alerts", alerts);
app.use("/users", users);
app.use("/miners", miners);
app.use("/static", static);
app.use("/sensors", sensors);
app.use("/reports", reports);
app.use("/settings", settings);
app.use("/dashboard", dasboard);
app.use("/measurements", measurements);
app.use("/access-points", accessPoints);
app.use("/announcements", announcements);
app.all("*", (_, res) => {
    res.send("OK v0.0.2");
});

//Error handler
app.use((err, _, res, __) => {
    res.status(500).send({ message: "Something went wrong" });
    const at = getLineFromError(err)
    if (isDev) {
        trycatch(() => console.log(err.message), (err) => console.log(err.message));
    } else {
        trycatch(() =>
            addToQueue(queueNames.LOGGER, { generatee_id: 999_999, generatee_name: "Server", massage: `${err.message} ${at}` })
        );
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
}).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(PORT);
        }, 1000);
    }

    server.listen(PORT, () => {
        console.log(`Server listening on port: ${PORT}`)
    });
})



io.on('connection', (socket) => {
    console.log("New user: ", socket.id)

    centralEmitter.on(serverEvents.NEW_ALERT, (data) => {
        socket.emit(serverEvents.NEW_ALERT, data);
    });

    centralEmitter.on(serverEvents.ACCESS_POINT, (data) => {
        socket.emit(serverEvents.ACCESS_POINT, data);
    });

    centralEmitter.on(serverEvents.ACCESS_POINT_FULL, (data) => {
        socket.emit(serverEvents.ACCESS_POINT_FULL, data);
    });

    centralEmitter.on(serverEvents.NEW_MEASUREMENT, (data) => {
        socket.emit(serverEvents.NEW_MEASUREMENT, data);
    });

    socket.on('disconnect', () => {
        socket.disconnect()
        console.log('user disconnected: ', socket.id);
    });
});

// create a child process to run cron jobs
fork('./src/utils/cron-child.js');
fork('./src/utils/generators.js');