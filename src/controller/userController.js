const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const db = require("../database/db");

async function getLoggedUser(req) { // no export
    let logged_id = jwt.decode(req.cookies.login).payload
    let user = {}
    db.query(`SELECT * FROM Users WHERE user_id=${logged_id};`, (error, results)=>{
        if (!error) {
            user = results.rows
        }
    })
    return user
}

async function getUserData(req, res) {
    let user = await getLoggedUser(req)
    res.json({
        name: user.name,
        email: user.email,
    })
}

function logOutUser(req, res) {
    
    res.cookie('login', ' ', { maxAge: 1 })
    res.redirect('/')
}

/// AUTHHHHHHHHHHHHH

async function postSignUp(req, res) {
    let user = req.body
    console.log(user)
    db.query(`INSERT INTO Users (name, email, password) values ('${user.name}', '${user.email}', '${user.password}');`, (error, results)=> {
        if (error) {
            res.json(error.message)
        } else {
            res.json(`${user.name} signed up!`)
        }
    })
}

async function postLogin(req, res) {
    try {
        let data = req.body
        let user = {}
        db.query(`SELECT FROM Users WHERE email=${data.email};`, (error, results)=>{
            if (error){
                res.json(error.message)
            } else {
                user = results.rows
            }
        })
        if (user) {
            if (user.password == data.password) {
                let uid = user.user_id
                let token = jwt.sign({ payload: uid }, JWT_KEY)
                res.cookie('login', token)
                res.json({
                    message: "Login Success!",
                    success: true
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

async function getSchedule(req, res) {
    let logged_user = getLoggedUser(req)
    db.query(`SELECT * FROM Doctors WHERE doctor_id=${logged_user.user_id};`, (error, results)=>{
        if (error) { 
            res.json(error.message)
        } else {

        }
    })

    db.query(`SELECT * FROM Schedule where doctor_id = ${logged_user.user_id};`, (error, results)=> {
        if (error) {
            res.json(error.message)
        }
        res.json(results.rows)
    })
}

module.exports = { getUserData, logOutUser, postSignUp, postLogin, getSchedule}