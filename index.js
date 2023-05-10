const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv").config();
const { db } = require("./src/utils/database");
const { newToken } = require("./src/utils/tokens");


const app = express();
const PORT = 3000 || process.env.PORT;

//Apply Midllewares
app.enable("trust proxy");
app.use([
    express.json(),
    cors(),
    express.urlencoded({ extended: true })
]);

//Connect to Db
// db.getConnection((err)=>{
//     if(err) throw err;
//     console.log("Database Connected");
// })

//Routes here
console.log(newToken("8371154e-36b8-43fe-916e-2645a9774d26"));

//Satrt the server
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});