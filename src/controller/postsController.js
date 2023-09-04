const db = require("../database/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const methods = require('./methods.js');

async function getAllPosts(req, res) {

    const posts = (await db.query(`
    SELECT
    p.date_time,
    p.upvotes,
    p.downvotes,
    q.question,
    q.answers,
    q.question_id,
    qu.name AS questioner_name,
    au.name AS doctor_name,
    a.answer
    FROM Posts p
    JOIN Questions q ON q.question_id = p.post_id
    JOIN Answers a ON a.question_id = q.question_id
    JOIN Users qu ON qu.user_id = q.user_id
    JOIN Users au ON au.user_id = a.doctor_id
    ;`)).rows

    res.json(posts)
}

// !!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!    // should be moved to methods
// !!!!!!!!!!!!!!!!!!!!!!!!!
async function createPost(req, res, next) { 
    try {
        const date = new Date();
        let currentDate = methods.dateToString(date)

        const postID = (await db.query(`
        INSERT INTO Posts (date_time, upvotes, downvotes) values ('${currentDate}'::DATE, ${0}, ${0})
        RETURNING post_id
        `)).rows.at(0).post_id

        console.log(postID)
        req.post_id = postID
        next()
    } catch (error) {
        res.json({
            success: false,
            message: 'Could not post.'
        })
    }

}

async function createQuestion(req, res) {
    try {
        const postID = req.post_id
        const data = req.body
        const user = await methods.getLoggedUser(req)

        const question = await db.query(`
        INSERT INTO Questions (question_id, user_id, question, answers) values (${postID}, ${user.user_id}, '${data.question}', ${0})
        ;`)

        res.json({
            success: true,
            message: 'Question posted.'
        })
    } catch (error) {
        res.json({
            success: false,
            message: 'Could not post.'
        })
    }

}

async function createAnswer(req, res) {
    try {
        const postID = req.post_id
        const data = req.body
        const user = await methods.getLoggedUser(req)
        const isDoctor = await methods.CheckIsDoctor(req)

        if (!isDoctor) {
            res.json({
                success: false,
                message: 'Only doctors can answer.'
            })
            return
        }

        const answer = await db.query(`
        INSERT INTO Answers (answer_id, question_id, doctor_id, answer) values (${postID}, ${data.question_id}, ${user.user_id}, '${data.answer}')
        ;`)

        // add replies counter here

        res.json({
            success: true,
            message: 'Answer posted.'
        })
    } catch (error) {
        res.json({
            success: false,
            message: 'Could not post.'
        })
    }
}


async function postVote(req, res) {
    try {
        const data = req.body
        const user = await methods.getLoggedUser(req)

        const isAlreadyVoted = (await db.query(`
        SELECT voter_id FROM Votes WHERE post_id=${data.post_id} AND voter_id=${user.user_id}
        ;`)).rowCount

        if (isAlreadyVoted) req.json({
            success: false,
            message: 'Cannot vote '
        })
    
        const vote = await db.query(`
        INSERT INTO Votes
        (post_id, voter_id, vote_type)
        values
        (${data.post_id}, ${user.user_id}, '${data.vote_type}')
        ;`)
    } catch(error) {
        res.json({
            success: false,
            message: 'Could not save vote.'
        })
    }

    // INCOMPLETE ...........
}

module.exports = {
    getAllPosts, createPost, createQuestion, createAnswer, postVote
}