const db = require("../database/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const methods = require('./methods.js')


function logOutUser(req, res) {

    res.cookie('login', ' ', { maxAge: 1 })
    res.redirect('/')
}

async function postSignUp(req, res) {
    let data = req.body
    let hashed_password = await methods.encryptPassword(data.password)
    try {
        let result = await db.query(`INSERT INTO Users (name, email, password) values ('${data.name}', '${data.email}', '${hashed_password}');`)

        if (data.isDoctor) {
            let user = await db.query(`SELECT * FROM Users WHERE email='${data.email}'`)
            console.log(user.rows.at(0).user_id)
            db.query(`INSERT INTO Doctors (doctor_id, department, address, fee) values (${user.rows.at(0).user_id}, '${data.department}', '${data.address}', ${data.fee});`)
                .then(results => { })
        }
        res.json(`${data.name} signed up!`)
    } catch (error) {
        console.log(error.message)
    }
}

async function postLogin(req, res) {
    try {
        let user = await methods.getUserByEmail(req.body.email)
        if (user) {
            if (await bcrypt.compare(req.body.password, user.password)) {
                let uid = user.user_id
                let token = jwt.sign({ payload: uid }, JWT_KEY)
                res.cookie('login', token)
                let isDoctor = await methods.CheckIsDoctor(user)
                res.json({
                    message: "Login Success!",
                    success: true,
                    isDoctor
                })

            } else {
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
    let user = await methods.getLoggedUser(req)

    if (user) {
        res.json({
            message: "Already logged in.",
            loggedIn: true
        })
    } else {
        res.json({
            message: "Login to continue.",
            loggedIn: false
        })
    }
}

async function getSchedule(req, res) {
    let logged_user = await methods.getLoggedUser(req)
    let isDoctor = await methods.CheckIsDoctor(logged_user)
    try {
        if (isDoctor) {
            db.query(`SELECT schedule_id, allowed_patients, appointed_patients, start_time, end_time FROM Schedule where doctor_id='${logged_user.user_id}';`, (error, results) => {
                if (error) {
                    res.json(error.message)
                } else {
                    res.json(results.rows)
                }
            })
        } else {
            res.json({ message: "Invalid Request" })
        }
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function postSchedule(req, res) {
    let logged_user = await methods.getLoggedUser(req)
    let indata = req.body
    let isDoctor = await methods.CheckIsDoctor(logged_user)
    try {
        if (isDoctor) {
            db.query(`INSERT INTO Schedule (doctor_id, allowed_patients, appointed_patients, start_time, end_time)
            values (${logged_user.user_id}, ${indata.allowed_patients}, ${0}, '${indata.start_time}', '${indata.end_time}')`, (error, results) => {
                if (error) {
                    res.json(error.message)
                } else {
                    res.json({ message: 'Schedule Created' })
                }
            })
        } else {
            res.json({ message: "Invalid Request" })
        }
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function updateSchedule(req, res) {
    let logged_user = await methods.getLoggedUser(req)
    let indata = req.body
    let isDoctor = await methods.CheckIsDoctor(logged_user)
    try {
        if (isDoctor) {
            db.query(`UPDATE Schedule 
            SET allowed_patients=${indata.allowed_patients}
            WHERE schedule_id=${indata.schedule_id} AND doctor_id=${logged_user.user_id};`, (error, results) => {
                if (error) {
                    res.json(error.message)
                } else {
                    res.json({ message: 'Schedule Updated' })
                }
            })
        } else {
            res.json({ message: "Invalid Request" })
        }
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function getAppointments(req, res) {
    let user = await methods.getLoggedUser(req)
    let isDoctor = await methods.CheckIsDoctor(user)
    if (!user) return null
    try {
        if (isDoctor) {
            const results = await db.query(`SELECT
                s.start_time,
                s.end_time,
                p.patient_name,
                p.age,
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
                p.age,
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
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function postAppointment(req, res) {
    let user = await methods.getLoggedUser(req)
    let data = req.body
    let isDoctor = await methods.CheckIsDoctor(user)
    try {
        if (!isDoctor) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // Note: Months are zero-based
            const day = currentDate.getDate();
            db.query(`INSERT INTO Patients (user_id, schedule_id, patient_name, age, gender, appointment_date) 
            SELECT * FROM (
                values (${user.user_id}, ${data.schedule_id}, '${data.patient_name}', ${data.age}, '${data.gender}', '${year}-${month}-${day}'::DATE)
            ) AS i(user_id, schedule_id, patient_name, age, gender, appointment_date)
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
        } else {
            res.json({
                message: "Invalid Request!"
            })
        }
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function getProfile(req, res) {
    let user = await methods.getLoggedUser(req)
    let isDoctor = await methods.CheckIsDoctor(user)
    console.log(user)

    try {
        if (isDoctor) {
            console.log("doc:", isDoctor)
            const results = await db.query(`SELECT
            U.name AS name,
            U.email AS email,
            D.department,
            D.address,
            D.fee
            FROM Doctors AS D
            JOIN Users AS U ON D.doctor_id = U.user_id
            WHERE user_id=${user.user_id};`)
            res.json(results.rows)

        } else {
            db.query(`SELECT name, email FROM Users WHERE user_id=${user.user_id};`, (error, results) => {
                if (error) res.json(error.message)
                else {
                    res.json(results.rows)
                }
            })
        }
    } catch (error) {
        res.json({ message: error.message })
    }
}

async function updateProfile(req, res) {
    let user = await methods.getLoggedUser(req)
    let isDoctor = await methods.CheckIsDoctor(user)
    let indata = req.body

    try {

        if (indata.password) {
            let newPass = await methods.encryptPassword(indata.password)
            const results = await db.query(`UPDATE Users
            SET name='${indata.name}', password='${newPass}'
            WHERE user_id=${user.user_id};`)
        } else {
            const results = await db.query(`UPDATE Users
            SET name='${indata.name}'
            WHERE user_id=${user.user_id};`)
        }

        if (isDoctor) {
            const results = await db.query(`UPDATE Doctors
            SET department='${indata.department}', address='${indata.address}', fee=${indata.fee}
            WHERE doctor_id=${user.user_id};`)
        }
        res.json({ message: "Profile Updated Successfully!" })

    } catch (error) {
        res.json({
            message: error.message
        })
    }

}



module.exports = { logOutUser, postSignUp, postLogin, getLogin, getSchedule, postSchedule, updateSchedule, getAppointments, postAppointment, getProfile, updateProfile }