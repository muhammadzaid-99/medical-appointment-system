const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const db = require("../database/db");

async function getLoggedUser(req) { // no export
    let logged_id = jwt.decode(req.cookies.login).payload
    try {
        const results = await db.query(`SELECT * FROM Users WHERE user_id=${logged_id};`)
        if (results.rows.length > 0) {
            return results.rows.at(0);
        } else {
            return null; // No user found
        }
    } catch (error) {
        throw error;
    }
}

async function getUserData(req, res) {
    let user = await getLoggedUser(req)
    res.json({
        name: user.name,
        email: user.email,
    })
}

function logOutUser(req, res) {

    res.cookie('login', ' ', { maxAge: 1 })
    res.redirect('/')
}

/// AUTHHHHHHHHHHHHH

async function postSignUp(req, res) {
    let user = req.body
    console.log(user)
    db.query(`INSERT INTO Users (name, email, password) values ('${user.name}', '${user.email}', '${user.password}');`, (error, results) => {
        if (error) {
            res.json(error.message)
        } else {
            res.json(`${user.name} signed up!`)
        }
    })
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

async function postLogin(req, res) {
    try {
        let user = await getUserByEmail(req.body.email)
        if (user) {
            if (user.password == req.body.password) {
                let uid = user.user_id
                let token = jwt.sign({ payload: uid }, JWT_KEY)
                res.cookie('login', token)
                res.json({
                    message: "Login Success!",
                    success: true
                })

            } else {
                console.log('niche agaya')
                res.json({
                    message: "Wrong Password!",
                    success: false
                })
            }
        }
    }
    catch (err) {
        res.json({
            message: err.message
        })
    }
}

async function getLogin(req, res) {
    let user = await getLoggedUser(req)

    if (user) {
        res.redirect('/schedule')
    } else {
        res.send('Login to continue.')
    }
}

async function getSchedule(req, res) {
    let logged_user = await getLoggedUser(req)
    let isDoctor = await CheckIsDoctor(logged_user)
    if (isDoctor) {
        db.query(`SELECT allowed_patients, appointed_patients, start_time, end_time FROM Schedule where doctor_id='${logged_user.user_id}';`, (error, results) => {
            if (error) {
                res.json(error.message)
            } else {
                res.json(results.rows)
            }
        })
    } else {
        // db.query(`SELECT * FROM Patients where user_id = '${logged_user.user_id}';`, (error, results) => {
        //     if (error) {
        //         res.json(error.message)
        //     }
        //     res.json(results.rows)
        // })
        res.json({message: "Invalid Request"})
    }
}

async function postSchedule(req, res) {
    let logged_user = await getLoggedUser(req)
    let indata = req.body
    let isDoctor = await CheckIsDoctor(logged_user)
    if (isDoctor) {
        db.query(`INSERT INTO Schedule (doctor_id, allowed_patients, appointed_patients, start_time, end_time)
        values (${logged_user.user_id}, ${indata.allowed_patients}, ${0}, '${indata.start_time}', '${indata.end_time}')`, (error, results) => {
            if (error) {
                res.json(error.message)
            } else {
                res.send('Schedule Created')
            }
        })
    } else {
        res.json({message: "Invalid Request"})
    }
}

async function getAppointments(req, res) {
    let user = await getLoggedUser(req)
    let isDoctor = await CheckIsDoctor(user)
    if (!user) return null
    if (isDoctor) {
        const results = await db.query(`SELECT
            s.start_time,
            s.end_time,
            p.patient_name,
            p.DOB,
            p.gender,
            p.appointment_date
            FROM
            Schedule s
            JOIN
            Patients p ON s.schedule_id = p.schedule_id
        WHERE
        s.doctor_id=${user.user_id};`)

        res.json(results.rows)
        
    } else {
        let booked = {}
        const booked_results = await db.query(`SELECT
        s.start_time,
        s.end_time,
        u.name AS doctor_name,
        d.department,
        d.address,
            d.fee,
            p.patient_name,
            p.DOB,
            p.gender,
            p.appointment_date
        FROM
        Schedule s
        JOIN
        Patients p ON s.schedule_id = p.schedule_id
        JOIN
        Doctors d ON s.doctor_id = d.doctor_id
        JOIN
        Users u on d.doctor_id = u.user_id
        WHERE
        p.user_id=${user.user_id};`)
        
        booked = booked_results.rows
        
        let available = {}
        const available_results = await db.query(`SELECT
            s.start_time,
            s.end_time,
            s.schedule_id,
            u.name AS doctor_name,
            d.department,
            d.address,
            d.fee
            FROM
            Schedule s
        JOIN
            Doctors d ON s.doctor_id = d.doctor_id
            JOIN
            Users u ON u.user_id = d.doctor_id
            WHERE
            s.appointed_patients < s.allowed_patients;
            --AND s.start_time > now()`)
        
        available = available_results.rows

        let response = {
            booked_appointments: booked,
            available_appointments: available
        }
        res.json(response)
    }
}

async function postAppointment(req, res) {
    let user = await getLoggedUser(req)
    let data = req.body
    let isDoctor = await CheckIsDoctor(user)
    if (! isDoctor) {
        db.query(`INSERT INTO Patients (user_id, schedule_id, patient_name, DOB, gender, appointment_date) 
        SELECT * FROM (
            values (${user.user_id}, ${data.schedule_id}, '${data.patient_name}', '${data.dob}'::DATE, '${data.gender}', '${data.appointment_date}'::DATE)
        ) AS i(user_id, schedule_id, patient_name, DOB, gender, appointment_date)
        WHERE NOT EXISTS (
           SELECT FROM Schedule sc
           WHERE  sc.schedule_id = i.schedule_id
           AND    sc.allowed_patients = sc.appointed_patients
        );`, (error, results) => {
            if (error) res.json(error.message)
            else {
                db.query(`UPDATE Schedule SET appointed_patients = appointed_patients + 1 WHERE schedule_id=${data.schedule_id}`)
                res.send(`Appointment booked for ${data.patient_name}`)
            }
        })
    }
}

async function getProfile(req, res) {
    let user = await getLoggedUser(req)
    let isDoctor = await CheckIsDoctor(user)
    console.log(user)

    if (isDoctor) {
        console.log("doc:", isDoctor)
        try {
            const results = await db.query(`SELECT
            D.doctor_id,
            U.name AS name,
            U.email AS email,
            D.department,
            D.address,
            D.fee
            FROM Doctors AS D
            JOIN Users AS U ON D.doctor_id = U.user_id;`)
        } catch (error) {
            throw error
        }

    } else {
        db.query(`SELECT name, email FROM Users WHERE user_id=${user.user_id};`, (error, results) => {
            if (error) res.json(error.message)
            else {
                res.json(results.rows)
            }
        })
    }
}

async function CheckIsDoctor(user) {

    const results = await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`)

    if (results.rowCount == 1) {
        return true
    }
    return false
}

module.exports = { getUserData, logOutUser, postSignUp, postLogin, getLogin, getSchedule, postSchedule, getAppointments, postAppointment, getProfile }