const db = require("../database/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWT_KEY = require('../config/keys.js')
const methods = require('./methods.js');
const { application } = require("express");


function logOutUser(req, res) {

    res.cookie('login', ' ', { maxAge: 1 })
    res.redirect('/')
}

async function postSignUp(req, res) {
    const data = req.body
    const hashed_password = await methods.encryptPassword(data.password)
    try {
        const result = await db.query(`INSERT INTO Users (name, email, password) values ('${data.name}', '${data.email}', '${hashed_password}');`)

        if (data.isDoctor) {
            const user = await db.query(`SELECT * FROM Users WHERE email='${data.email}'`)
            db.query(`INSERT INTO Doctors (doctor_id, department, address, fee) values (${user.rows.at(0).user_id}, '${data.department}', '${data.address}', ${data.fee});`)
                .then(results => { })
        }
        res.json({message: `${data.name} signed up!`, success: true})
    } catch (error) {
        res.json({message: error.message, success: false})
    }
}

async function postLogin(req, res) {
    try {
        const user = await methods.getUserByEmail(req.body.email)
        if (user) {
            if (await bcrypt.compare(req.body.password, user.password)) {
                let uid = user.user_id
                let login_cookie = jwt.sign({ payload: uid }, JWT_KEY)
                res.cookie('login', login_cookie)
                // let isDoctor = await methods.CheckIsDoctor(user)
                const isDoctor = (await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`)).rowCount
                let user_payload = isDoctor ? 1 : 0
                let usertype_cookie = jwt.sign({ payload: user_payload }, JWT_KEY)
                res.cookie('usertype', usertype_cookie)
                res.json({
                    message: "Login Success!",
                    success: true,
                    isDoctor: true
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
    const user = await methods.getLoggedUser(req)
    const isDoctor = (await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`)).rowCount
    let user_payload = isDoctor ? 1 : 0
    let usertype_cookie = jwt.sign({ payload: user_payload }, JWT_KEY)
    res.cookie('usertype', usertype_cookie)

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
    const logged_user = await methods.getLoggedUser(req)
    const isDoctor = await methods.CheckIsDoctor(req)
    try {
        if (isDoctor) {
            db.query(`SELECT schedule_id, allowed_patients, appointed_patients, start_time, end_time FROM Schedule where doctor_id='${logged_user.user_id}';`, (error, results) => {
                if (error) {
                    res.json(error.message)
                } else {
                    res.json({
                        schedules: results.rows
                    })
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
    const logged_user = await methods.getLoggedUser(req)
    const indata = req.body
    const isDoctor = await methods.CheckIsDoctor(req)
    try {
        if (isDoctor) {
            db.query(`INSERT INTO Schedule (doctor_id, allowed_patients, appointed_patients, start_time, end_time)
            values (${logged_user.user_id}, ${indata.allowed_patients}, ${0}, '${indata.start_time}', '${indata.end_time}')`, (error, results) => {
                if (error) {
                    res.json(error.message)
                } else {
                    res.json({
                        message: 'Schedule Created',
                        success: true
                    })
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
    const logged_user = await methods.getLoggedUser(req)
    const inData = req.body
    const isDoctor = await methods.CheckIsDoctor(req)
    const schedule = (await db.query(`SELECT * FROM Schedule WHERE schedule_id=${inData.schedule_id};`)).rows.at(0)
    try {
        if (isDoctor) {
            const currentTime = new Date()
            const scheduleTime = new Date((schedule.start_time).toISOString())
            if (currentTime > scheduleTime) {
                res.json({
                    message: 'Past schedules cannot be modified.',
                    success: false
                })
            }

            if (schedule.appointed_patients < inData.allowed_patients) {
                db.query(`UPDATE Schedule 
                SET allowed_patients=${inData.allowed_patients}
                WHERE schedule_id=${inData.schedule_id} AND doctor_id=${logged_user.user_id}
                AND start_time > NOW();`, (error, results) => {
                    if (error) {
                        res.json(error.message)
                    } else {
                        res.json({ message: 'Schedule Updated', success: true })
                    }
                })
            } else {
                const updt = await db.query(`UPDATE Schedule 
                SET appointed_patients=${inData.allowed_patients}, allowed_patients=${inData.allowed_patients}
                WHERE schedule_id=${inData.schedule_id} AND doctor_id=${logged_user.user_id} 
                AND start_time > NOW();`)

                let patientsToBeRescheduled = schedule.appointed_patients - inData.allowed_patients
                const resch = await reschedulePatients(schedule, patientsToBeRescheduled)
                res.json({
                    message: resch.message
                })
            }
        } else {
            res.json({ message: "Invalid Request" })
        }
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function deleteSchedule(req, res) {
    const inData = req.body
    const isDoctor = await methods.CheckIsDoctor(req)
    const schedule = (await db.query(`SELECT * FROM Schedule WHERE schedule_id=${inData.schedule_id};`)).rows.at(0)
    try {
        if (isDoctor) {
            const currentTime = new Date()
            const scheduleTime = new Date((schedule.start_time).toISOString())
            console.log("Time", currentTime > scheduleTime)
            if (currentTime > scheduleTime) {
                res.json({
                    message: 'Past schedules cannot be deleted.',
                    success: false
                })
                return
            }

            let patientsToBeRescheduled = schedule.appointed_patients
            const resch = await reschedulePatients(schedule, patientsToBeRescheduled)

            if (!resch.success) {
                res.json({ message: 'Could not reschedule patient(s)!', success: false })
                return
            }
            db.query(`
            DELETE FROM Schedule WHERE schedule_id=${schedule.schedule_id};`, (error, results) => {
                if (error) {
                    res.json({message: error.message, success: false})
                } else {
                    res.json({
                        message: 'Schedule Deleted',
                        succe: true
                    })
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

async function reschedulePatients(schedule, patientsCount) {
    try {
        const patientsDescendingByTurn = (await db.query(`
        SELECT *
        FROM Patients
        WHERE schedule_id=${schedule.schedule_id}
        ORDER BY turn DESC
        LIMIT ${patientsCount};
        `)).rows

        const patients = Array.from(patientsDescendingByTurn).reverse();

        const next_schedules = (await db.query(`
        SELECT * FROM Schedule WHERE doctor_id=${schedule.doctor_id}
        AND start_time > '${schedule.start_time.toISOString()}';
        `)).rows

        let rescheduled = 0, coveredInRounds = 0, toCoverInRound = 0, empty_slots = 0;
        for (let round = 0; round < next_schedules.length; round++) {
            empty_slots = next_schedules.at(round).allowed_patients - next_schedules.at(round).appointed_patients

            for (; (rescheduled < patientsCount) && (empty_slots); rescheduled++) {
                const inc_turn_P = await db.query(`
                UPDATE Patients
                SET turn = turn + 1
                WHERE schedule_id = ${next_schedules.at(round).schedule_id};
                `)

                toCoverInRound = empty_slots < (patientsCount - rescheduled) ? empty_slots : (patientsCount - rescheduled)
                let index = coveredInRounds + toCoverInRound - 1

                const reschedulePatient = await db.query(`
                UPDATE Patients
                SET schedule_id=${next_schedules.at(round).schedule_id}, turn=${1}
                WHERE patient_id=${patients.at(index).patient_id}
                `)
                empty_slots--;
                methods.UpdateAppointedPatients(patients.at(index).schedule_id)
                methods.UpdateAppointedPatients(next_schedules.at(round).schedule_id)
            }
            coveredInRounds = rescheduled;
            if (rescheduled == patientsCount)
                break;
        }

        if (rescheduled < patientsCount) {
            for (let i = rescheduled; i < patientsCount; i++) {
                const deleteRemainingPatients = await db.query(`DELETE FROM Patients WHERE patient_id=${patients.at(i).patient_id};`)
            }
        }

        return {
            success: true,
            message: 'Rescheduled'
        }
    } catch (error) {
        return {
            message: error.message
        }
    }

}

async function getAppointments(req, res) {
    const user = await methods.getLoggedUser(req)
    const isDoctor = await methods.CheckIsDoctor(req)
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

            const response = {
                isDoctor: true,
                appointments: results.rows
            }
            res.json(response)

        } else {
            let booked = {}
            const booked_results = await db.query(`SELECT
            s.start_time,
            s.end_time,
            s.allowed_patients,
            u.name AS doctor_name,
            d.department,
            d.address,
            d.fee,
            p.patient_name,
            p.age,
            p.gender,
            p.appointment_date,
            p.turn,
            p.patient_id
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
            for (const appn of booked) {
                let starttime = new Date(appn.start_time)
                let endtime = new Date(appn.end_time)
                const timeDiff = endtime - starttime // milliseconds

                const minutes = Math.floor(timeDiff / 60000);
                let interval = minutes / appn.allowed_patients
                let end_mins = interval * appn.turn
                let start_mins = end_mins - interval

                const start_interval = new Date(starttime.getTime() + start_mins * 60000);
                const end_interval = new Date(start_interval.getTime() + end_mins * 60000);

                appn.start_interval = start_interval
                appn.end_interval = end_interval

                delete appn.allowed_patients
            }

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
                s.appointed_patients < s.allowed_patients
                AND s.start_time > NOW();`)

            available = available_results.rows

            let response = {
                isDoctor: false,
                appointments: booked,
                available_slots: available
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
    const user = await methods.getLoggedUser(req)
    const data = req.body
    const isDoctor = await methods.CheckIsDoctor(req)
    try {
        if (!isDoctor) {
            const currentDate = new Date();
            let appdate = methods.dateToString(currentDate)

            let appointed_patients = (await db.query(`SELECT appointed_patients FROM Schedule WHERE schedule_id=${data.schedule_id};`)).rows.at(0).appointed_patients
            let turn = parseInt(appointed_patients) + 1
            const patient = {
                user_id: user.user_id,
                schedule_id: data.schedule_id,
                patient_name: data.patient_name,
                age: data.age,
                gender: data.gender,
                appointment_date: appdate,
                turn
            }
            const response = await InsertPatient(patient)
            console.log(response)
            res.json(response)
        } else {
            res.json({
                message: "Invalid Request!",
                success: false
            })
        }
    } catch (error) {
        res.json({
            message: error.message
        })
    }
}

async function deleteAppointment(req, res) {
    const isDoctor = await methods.CheckIsDoctor(req)
    const data = req.body

    if (isDoctor) res.json({
        message: "Invalid Request!",
        success: false
    })
    try {
        const scheduleID = (await db.query(`SELECT schedule_id FROM Patients WHERE patient_id=${data.patient_id}`)).rows.at(0).schedule_id
        db.query(`
        DELETE FROM Patients WHERE patient_id=${data.patient_id} 
        `, (error, results) => {
            if (error) {
                res.json({
                    message: error.message,
                    success: false
                })
            } else {
                res.json({
                    message: 'Deleted Appointment',
                    success: true
                })
            }
        })
        const patientsCount = await methods.UpdateAppointedPatients(scheduleID)
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

async function InsertPatient(patient) {
    try {
        const insertQuery = `
            INSERT INTO Patients (user_id, schedule_id, patient_name, age, gender, appointment_date, turn) 
            SELECT * FROM (
                VALUES (
                    ${patient.user_id},
                    ${patient.schedule_id},
                    '${patient.patient_name}',
                    ${patient.age},
                    '${patient.gender}',
                    '${patient.appointment_date}'::DATE,
                    ${patient.turn}
                )
            ) AS i(user_id, schedule_id, patient_name, age, gender, appointment_date)
            WHERE NOT EXISTS (
                SELECT FROM Schedule sc
                WHERE sc.schedule_id = i.schedule_id
                AND sc.allowed_patients = sc.appointed_patients
            );
        `;

        const insertResult = await new Promise((resolve, reject) => {
            db.query(insertQuery, (error, results) => {
                if (error) {
                    reject({
                        message: error.message,
                        success: false
                    });
                } else {
                    resolve({
                        message: `Appointment booked for ${patient.patient_name}`,
                        success: true
                    });
                }
            });
        });
        const incAppPatients = await methods.UpdateAppointedPatients(patient.schedule_id)

        if (incAppPatients.success)
            return insertResult;
    } catch (error) {
        return {
            message: error.message,
            success: false
        };
    }
}


async function getProfile(req, res) {
    const user = await methods.getLoggedUser(req)
    const isDoctor = await methods.CheckIsDoctor(req)
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
    const user = await methods.getLoggedUser(req)
    const isDoctor = await methods.CheckIsDoctor(req)
    const indata = req.body

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



module.exports = {
    logOutUser, postSignUp, postLogin, getLogin, getSchedule, postSchedule, updateSchedule, deleteSchedule,
    getAppointments, postAppointment, deleteAppointment, getProfile, updateProfile
}