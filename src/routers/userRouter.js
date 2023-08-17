const express = require('express');
const userRouter = express.Router()
const checkLogin = require('./authValidator.js')
const userController = require('../controller/userController.js')

userRouter
    .route('/logout')
    .get(userController.logOutUser)

userRouter
    .route('/signup')
    .post(userController.postSignUp)

userRouter
    .route('/login')
    .get(userController.getLogin)
    .post(userController.postLogin)

userRouter
    .route('/schedule')
    .get(userController.getSchedule)

userRouter
    .route('/appointment')

userRouter
    .route('/profile')

    

module.exports = userRouter