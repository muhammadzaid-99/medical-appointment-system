require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path')
const cookieParser = require('cookie-parser');
const db = require("./src/database/db");
app.use(cookieParser());
app.use(express.json()) // for frontend_data -> json, to access req.body

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>{
    console.log(`Server listening on Port ${PORT}`)
}); // by default localhost

app.use(express.static(path.join(__dirname, '/src/public')))

const userRouter = require('./src/routers/userRouter.js')

app.use('/', userRouter)