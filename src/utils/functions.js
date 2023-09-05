const path = require('path');
const sendEmail = require('./email');
const { db } = require('./database');
const { addLogToQueue } = require('./logs');
const expressAsyncHandler = require('express-async-handler');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;


const getLineFromError = (err = { stack: "" }) => {
    const { stack } = err;
    const lines = stack.split("\n");
    return lines[1] ? lines[1].trim() : "No line";
};

const timeStamp = new Date();

//function to generate a report for the measurements table
function generateMeasurments(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
            SELECT
                id, id_prefix, sensor_id, access_point_id, created_at, location, other_data 
            FROM
                measurements
            WHERE
                created_at >= ? AND created_at <= ?
        ;`,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generator Worker", `Failed to generate logs with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `measurement-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'sensor_id', title: 'Senser ID' },
                    { id: 'access_point_id', title: 'AccessPoint ID' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'location', title: 'Location' },
                    { id: 'other_data', title: 'Other Data' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new measurements report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }
                            addLogToQueue(999_999, "Reports", `New report genetated for measurement with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};

//function to generate a report for the logs table
function generateLogs(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
            SELECT
                id, id_prefix, loger_id, loger_name, created_at, message 
            FROM
                logs
            WHERE
                created_at >= ? AND created_at <= ?;
        `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generator Worker", `Failed to generate logs with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `logs-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'loger_id', title: 'Loger ID' },
                    { id: 'loger_name', title: 'Loger name' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'message', title: 'Message' }
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new log report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }

                            addLogToQueue(999_999, "Reports", `New report genetated for log with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};

//Generate a report for the reports
function generateReport(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
        SELECT
            id, id_prefix, user_id, file_name, created_at  
        FROM
            reports
        WHERE
            created_at >= ? AND created_at <= ?;
        `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generator Worker", `Failed to generate logs with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `reports-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'sensor_id', title: 'Senser ID' },
                    { id: 'access_point_id', title: 'AccessPoint ID' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'location', title: 'Location' },
                    { id: 'other_data', title: 'Other Data' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new Report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }
                            addLogToQueue(user_id, "Reports", `New report genetated for reports with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));
            return;
        })
    )
};

//Generate a report for users table
function generateUsersReport(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
        SELECT 
            id, id_prefix, name, email, user_role_id, created_by, created_at, updated_by, updated_at, phone, access_id, area_id 
        FROM 
            users
        WHERE
            created_at >= ? AND created_at <= ?;
        `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generator Worker", `Failed to generate logs with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `users-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'name', title: 'Name' },
                    { id: 'email', title: 'Email' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'user_role_id', title: 'User Role' },
                    { id: 'created_by', title: 'Created By' },
                    { id: 'updated_at', title: 'Updated At' },
                    { id: 'phone', title: 'Created By' },
                    { id: 'access_id', title: 'Access' },
                    { id: 'area_id', title: 'Area' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Generators", `Failed to generate a new users report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }

                            addLogToQueue(user_id, "Reports", `New report genetated for users table with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};

//Generate a report for the areas table
function generateAreas(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
        SELECT
            id, id_prefix, name, lat, longitude, created_at, draw_coords 
        FROM
          areas
        WHERE
          created_at >= ? AND created_at <= ?;
        `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generate Worker", `Failed to generate areas report with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `areas-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'name', title: 'Name' },
                    { id: 'lat', title: 'Latitude' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'longitude', title: 'Longitude' },
                    { id: 'draw_coords', title: 'Area Boundry Coordinates' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new areas report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }
                            addLogToQueue(user_id, "Reports", `New report genetated for areas with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};

//generate a report for sensors table
function generateSensorsReport(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
        SELECT
            id, id_prefix, status, device_id, available, updated_by, updated_at, created_by, created_at 
        FROM
          sensors
        WHERE
          created_at >= ? AND created_at <= ?;;
      `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generate Worker", `Failed to generate sensors report with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `sensors-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'status', title: 'Senser Status' },
                    { id: 'device_id', title: 'Device ID' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'available', title: 'Availavle' },
                    { id: 'updated_by', title: 'Updated By' },
                    { id: 'updated_at', title: 'Last Updated' },
                    { id: 'created_by', title: 'Created By' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                    INSERT INTO reports
                        (user_id, file_name) 
                    VALUES 
                        (?, ?);
                    `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new sensors report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }
                            addLogToQueue(user_id, "Reports", `New report genetated for sensors with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};

//generate a report for the report
function generateAccessPoints(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
        SELECT 
            id, id_prefix, area_id, name, lat, longitude, status, device_id, created_at 
        FROM 
            access_points
        WHERE
          created_at >= ? AND created_at <= ?;
        `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generate Worker", `Failed to generate sensors report with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `access-points-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'area_id', title: 'Senser ID' },
                    { id: 'name', title: 'Name' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'lat', title: 'Latitude' },
                    { id: 'longitude', title: 'Longitude' },
                    { id: 'status', title: 'Status' },
                    { id: 'device_id', title: 'Device ID' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new access-points report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }

                            addLogToQueue(user_id, "Reports", `New report genetated for access-points with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};

//generate a report for report settings
function generateMiners(date, user_id = 999_999, otherData = { email: "", notify: false }) {
    db.execute(
        `
        SELECT
            id, id_prefix, name, email, status, created_at, created_by, updated_at, updated_by, user_id, shift_id, sensor_id 
        FROM
          miners
        WHERE
          created_at >= ? AND created_at <= ?;
      `,
        [date[0], date[1]],
        expressAsyncHandler(async (err, data) => {
            if (err) {
                addLogToQueue(999_999, "Generate Worker", `Failed to generate miners report with error: ${JSON.stringify(err)}`)
                return
            }

            const logFileName = `sensors-${Date.now()}.csv`;
            const filePath = path.join(__dirname, `../docs/${logFileName}`);

            const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'id_prefix', title: 'ID prefix' },
                    { id: 'sensor_id', title: 'Senser ID' },
                    { id: 'name', title: 'Full Name' },
                    { id: 'created_at', title: 'Created_At' },
                    { id: 'email', title: 'Email' },
                    { id: 'status', title: 'Status' },
                    { id: 'created_by', title: 'Created By' },
                    { id: 'updated_at', title: 'Last Update' },
                    { id: 'updated_by', title: 'Updated By' },
                    { id: 'user_id', title: 'Supervisor' },
                    { id: 'shift_id', title: 'Shift' },
                ],
                recordDelimiter: '\r\n',
            });

            csvWriter.writeRecords(data).then(
                () => {
                    db.execute(`
                        INSERT INTO reports
                            (user_id, file_name) 
                        VALUES 
                            (?, ?);
                        `,
                        [user_id, logFileName], (err, dbResults) => {
                            if (err) {
                                addLogToQueue(999_999, "Reports", `Failed to generate a new miners report. Data: ${JSON.stringify(err)}`)
                                return;
                            }

                            if (otherData.email && otherData.notify) {
                                sendEmail(otherData.email, "Your Requested Report",
                                    `<dFiv>
                                        <table>
                                            <tr>
                                                <td>File name: </td>
                                                <td>${logFileName}</td>
                                            </tr>
                                            <tr>
                                                <td>Date: </td>
                                                <td>${timeStamp.toDateString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Link: </td>
                                                <td>https://ccb-c931.onrender.com/reports/${logFileName}</td>
                                            </tr>
                                        </table>
                                    </div>`
                                )
                            }

                            addLogToQueue(user_id, "Reports", `New report genetated for report settings with id ${dbResults.insertId}`)
                        }
                    )
                }
            ).catch(err => console.error(err));

            return;
        })
    )
};


module.exports = {
    generateAccessPoints,
    generateLogs,
    generateMeasurments,
    generateMiners,
    generateReport,
    generateUsersReport,
    generateAreas,
    generateSensorsReport,

    getLineFromError,
};