const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv").config();

const { db } = require("./src/utils/database");

//Routes
const auth = require("./src/routes/auth");


const app = express();
const PORT = 3000 || process.env.PORT;

//Apply Midllewares
app.enable("trust proxy");
app.use([
    express.json(),
    cors(),
    express.urlencoded({ extended: true })
]);

// //Connect to Db
// db.getConnection((err)=>{
//     if(err) throw err;
//     console.log("Database Connected");
// })


//Routes here
app.use("/auth", auth)
app.all("/", (_, res)=>{
    res.send();
})

//Satrt the server
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});