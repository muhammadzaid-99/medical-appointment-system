const express = require('express');
const userRouter = express.Router()
const checkLogin = require('./authValidator.js')
const userController = require('../controller/userController.js')

userRouter  // only for doctor
    .route('/schedule')
    .get(checkLogin, userController.getSchedule) 
    .post(checkLogin, userController.postSchedule)  
    .put(checkLogin, userController.updateSchedule)
    .delete(checkLogin, userController.deleteSchedule)

userRouter
    .route('/appointments') 
    .get(checkLogin, userController.getAppointments) // both
    .post(checkLogin, userController.postAppointment) // patient
    .delete(checkLogin, userController.deleteAppointment)

userRouter
    .route('/profile')
    .get(checkLogin, userController.getProfile)
    .put(checkLogin, userController.updateProfile)

    

module.exports = userRouter