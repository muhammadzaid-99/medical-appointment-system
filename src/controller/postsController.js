const db = require("../database/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const methods = require('./methods.js');

async function getAllPosts(req, res) {

    const questions = (await db.query(`
    SELECT
    p.date_time,
    p.upvotes,
    p.downvotes,
    q.question,
    q.answers_count,
    q.question_id,
    u.name
    FROM Posts p
    JOIN Questions q ON q.question_id = p.post_id
    JOIN Users u ON u.user_id = q.user_id
    ;`)).rows

    const answers = (await db.query(`
    SELECT
    p.date_time,
    p.upvotes,
    p.downvotes,
    a.answer,
    a.answer_id,
    a.question_id,
    u.name
    FROM Posts p
    JOIN Answers a ON a.answer_id = p.post_id
    JOIN Users u ON u.user_id = a.doctor_id
    ;`)).rows

    for (let i = 0; i < questions.length; i++) {
        const filteredAnswers = answers.filter(ans => ans.question_id == questions.at(i).question_id);
        questions.at(i).answers = filteredAnswers
    }

    res.json(questions)
}

// !!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!    // should be moved to methods i.e. without next()
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
        INSERT INTO Questions (question_id, user_id, question, answers_count) values (${postID}, ${user.user_id}, '${data.question}', ${0})
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

        const ans_count = await methods.UpdateAnswerCount(data.question_id)

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

async function deletePost(req, res) {
    try {
        const post_id = req.body.post_id
        const user = await methods.getLoggedUser(req)

        const delQ = await db.query(`
        DELETE FROM Questions WHERE question_id=${post_id} AND user_id=${user.user_id}
        RETURNING question_id
        ;`)

        const delA = await db.query(`
        DELETE FROM Answers WHERE (question_id=${post_id} OR answer_id=${post_id}) AND doctor_id=${user.user_id}
        RETURNING answer_id
        ;`)

        if (delQ.rowCount || delA.rowCount) { // if any answer or question is deleted, delete linked post
            const delVotesforQorA = await db.query(`
            DELETE FROM Votes WHERE post_id=${post_id}
            ;`)
            const delPforQorA = await db.query(`
            DELETE FROM Posts WHERE post_id=${post_id}
            ;`)
        }
        if (delQ.rowCount) { // if the answers are deleted automatically with question
            const ansIDs = delA.rows // not confirm whether works or not
            for (let i = 0; i < ansIDs.length; i++) { 

                const delVotesforAs = await db.query(`
                DELETE FROM Votes WHERE post_id=${ansIDs.at(i).answer_id}
                ;`)

                const delPforAs = await db.query(`
                DELETE FROM Posts WHERE post_id=${ansIDs.at(i).answer_id}
                ;`)
            }
        }

        res.json({
            success: true,
            message: 'Post deleted.'
        })
    }
    catch (error) {
        res.json({
            success: false,
            message: 'Could not delete post.'
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

        if (isAlreadyVoted) {
            const updateVote = await db.query(`
            UPDATE TABLE Votes SET vote_type='${data.vote_type}'
            WHERE voter_id=${user.user_id} AND post_id=${data.post_id}
            ;`)

            const unvote = await db.query(`
            DELETE FROM Votes WHERE post_id=${data.post_id} AND voter_id=${user.user_id}
            ;`)
        } else {
            const vote = await db.query(`
            INSERT INTO Votes
            (post_id, voter_id, vote_type)
            values
            (${data.post_id}, ${user.user_id}, '${data.vote_type}')
            ;`)
        }

    } catch (error) {
        res.json({
            success: false,
            message: 'Could not save vote.'
        })
    }
}

async function deleteVote(req, res) {
    try {
        const data = req.body
        const user = await methods.getLoggedUser(req)

        db.query(`
        DELETE FROM Votes WHERE post_id=${data.post_id} AND voter_id=${user.user_id}
        ;`, (error, results) => {
            if (error) {
                res.json({
                    success: false,
                    message: "Could not delete."
                })
            } else {
                res.json({
                    success: true,
                    message: "Deleted vote."
                })
            }
        })

    } catch (error) {
        res.json({
            success: false,
            message: 'Could not delete vote.'
        })
    }

}

async function test(req, res) {
    return
    const delA = await db.query(`
    DELETE FROM Schedule WHERE (schedule_id=${2} OR appointed_patients=${0}) AND doctor_id=${38}
    RETURNING schedule_id
    ;`)

    console.log(delA.rows)
}

module.exports = {
    getAllPosts, createPost, createQuestion, createAnswer, deletePost, postVote, deleteVote, test
}