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

userRouter  // only for doctor
    .route('/schedule')
    .get(checkLogin, userController.getSchedule) 
    .post(checkLogin, userController.postSchedule)  
    .put(checkLogin, userController.updateSchedule)

userRouter
    .route('/appointments') 
    .get(checkLogin, userController.getAppointments) // both
    .post(checkLogin, userController.postAppointment) // patient

userRouter
    .route('/profile')
    .get(checkLogin, userController.getProfile)
    .put(checkLogin, userController.updateProfile)

    

module.exports = userRouter