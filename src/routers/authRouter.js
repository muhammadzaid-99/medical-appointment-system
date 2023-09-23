const express = require('express');
const authRouter = express.Router()
const checkLogin = require('./authValidator.js')
const authController = require('../controller/authController.js')

authRouter
    .route('/logout')
    .get(authController.logOutUser)

authRouter
    .route('/signup')
    .post(authController.postSignUp)

authRouter
    .route('/login')
    .get(authController.getLogin)
    .post(authController.postLogin)

module.exports = authRouter