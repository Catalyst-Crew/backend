// centralEventEmitter.js
const EventEmitter = require('events');
const centralEmitter = new EventEmitter();

const serverEvents = {
    ACCESS_POINT: "ACCESS_POINT",
    ACCESS_POINT_FULL: "ACCESS_POINT_FULL",
    NEW_ALERT: "NEW_ALERT",
    QUEUE_UPDATE: "QUEUE_UPDATE",
    NEW_MEASUREMENT: "NEW_MEASUREMENT"
}

module.exports = { serverEvents, centralEmitter };
