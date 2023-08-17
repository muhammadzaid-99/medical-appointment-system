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

app.use(express.static(path.join(__dirname, 'public')))

const userRouter = require('./src/routers/userRouter.js')
// const authRouter = require('./routers/authRouter.js')

app.use('/', userRouter)
// app.use('/auth', authRouter)

// app.use('/', (req,res)=>{
//     res.sendFile('./public/homepage.html', {root: __dirname})
// })

app.get('/', (req, res) => {
    db.query(`select * from schedule where schedule_id=23;`, (err, rslt)=>{
        res.json(rslt)
    })
})