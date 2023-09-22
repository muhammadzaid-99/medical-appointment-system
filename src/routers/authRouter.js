const express = require('express');
const authRouter = express.Router()
const checkLogin = require('./authValidator.js')
const userController = require('../controller/userController.js')

authRouter
    .route('/logout')
    .get(userController.logOutUser)

authRouter
    .route('/signup')
    .post(userController.postSignUp)

authRouter
    .route('/login')
    .get(userController.getLogin)
    .post(userController.postLogin)

module.exports = authRouter