const express = require('express');
const postsRouter = express.Router()
const checkLogin = require('./authValidator.js')
const postsController = require('../controller/postsController.js')

postsRouter
    .route('/')
    .get(postsController.getAllPosts)

postsRouter
    .route('/question')
    .post(checkLogin, postsController.createPost, postsController.createQuestion)

postsRouter
    .route('/answer')
    .post(checkLogin, postsController.createPost, postsController.createAnswer)

postsRouter
    .route('/vote')
    .post(checkLogin, postsController.postVote)

module.exports = postsRouter