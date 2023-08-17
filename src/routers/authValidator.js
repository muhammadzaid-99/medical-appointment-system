const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')

function checkLogin(req, res, next) {
    if (req.cookies.login) {
        let isVerified = jwt.verify(req.cookies.login, JWT_KEY)
        if (isVerified) {
            next()
        } else {
            res.json({
                message: "Access could not be verified."
            })
        }
    } else {
        res.json({
            message: "Access is denied."
        })
    }
}

module.exports = checkLogin