const jwt = require('jsonwebtoken')
const db = require("../database/db");
const bcrypt = require('bcrypt');

async function getLoggedUser(req) { // no export
    try {
        let logged_id = jwt.decode(req.cookies.login).payload
        const results = await db.query(`SELECT * FROM Users WHERE user_id=${logged_id};`)
        if (results.rows.length > 0) {
            return results.rows.at(0);
        } else {
            return null; // No user found
        }
    } catch (error) {
        return null
    }
}

// async function getUserData(req, res) {
//     let user = await getLoggedUser(req)
//     res.json({
//         name: user.name,
//         email: user.email,
//     })
// }

async function encryptPassword(password) {
    let hashed_password = await bcrypt.hash(password, 10)
    return hashed_password
}

async function getUserByEmail(email) {
    try {
        const results = await db.query(`SELECT * FROM Users WHERE email='${email}';`);
        if (results.rows.length > 0) {
            return results.rows.at(0);
        } else {
            return null; // No user found
        }
    } catch (error) {
        throw error;
    }
}

async function CheckIsDoctor(user) {

    const results = await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`)

    if (results.rowCount == 1) {
        return true
    }
    return false
}

module.exports ={getLoggedUser, getUserByEmail, encryptPassword, CheckIsDoctor}