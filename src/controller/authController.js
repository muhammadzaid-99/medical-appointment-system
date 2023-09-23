const db = require("../database/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const methods = require('./methods.js');

function logOutUser(req, res) {

    res.cookie('login', ' ', { maxAge: 1 })
    res.redirect('/')
}

async function postSignUp(req, res) {
    const data = req.body
    const hashed_password = await methods.encryptPassword(data.password)
    try {
        const result = await db.query(`INSERT INTO Users (name, email, password) values ('${data.name}', '${data.email}', '${hashed_password}');`)

        if (data.isDoctor) {
            const user = await db.query(`SELECT * FROM Users WHERE email='${data.email}'`)
            db.query(`INSERT INTO Doctors (doctor_id, department, address, fee) values (${user.rows.at(0).user_id}, '${data.department}', '${data.address}', ${data.fee});`)
                .then(results => { })
        }
        res.json({message: `${data.name} signed up!`, success: true})
    } catch (error) {
        res.json({message: error.message, success: false})
    }
}

async function postLogin(req, res) {
    try {
        const user = await methods.getUserByEmail(req.body.email)
        if (user) {
            if (await bcrypt.compare(req.body.password, user.password)) {
                let uid = user.user_id
                let login_cookie = jwt.sign({ payload: uid }, JWT_KEY)
                res.cookie('login', login_cookie)
                // let isDoctor = await methods.CheckIsDoctor(user)
                const docExists = (await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`)).rowCount
                let user_payload = docExists ? 1 : 0
                let usertype_cookie = jwt.sign({ payload: user_payload }, JWT_KEY)
                let isDoctor = docExists ? true : false;
                res.cookie('usertype', usertype_cookie)
                res.json({
                    message: "Login Success!",
                    success: true,
                    isDoctor
                })

            } else {
                res.json({
                    message: "Wrong Password!",
                    success: false
                })
            }
        }
    }
    catch (err) {
        res.json({
            message: err.message
        })
    }
}

async function getLogin(req, res) {
    const user = await methods.getLoggedUser(req)
    
    if (user) {
        const isDoctor = (await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`)).rowCount
        let user_payload = isDoctor ? 1 : 0
        let usertype_cookie = jwt.sign({ payload: user_payload }, JWT_KEY)
        res.cookie('usertype', usertype_cookie)
        res.json({
            message: "Already logged in.",
            loggedIn: true
        })
    } else {
        res.json({
            message: "Login to continue.",
            loggedIn: false
        })
    }
}

module.exports = {
    logOutUser, postSignUp, postLogin, getLogin
}