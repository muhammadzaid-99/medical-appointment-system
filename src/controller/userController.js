const db = require("../database/db");
const methods = require("./methods.js");
const { sendMail } = require("../utility/nodemailer");

async function getSchedule(req, res) {
	const logged_user = await methods.getLoggedUser(req);
	const isDoctor = await methods.CheckIsDoctor(req);
	try {
		if (isDoctor) {
			db.query(
				`SELECT schedule_id, allowed_patients, appointed_patients, start_time, end_time FROM Schedule where doctor_id='${logged_user.user_id}';`,
				(error, results) => {
					if (error) {
						res.status(500).json(error.message);
					} else {
						res.status(200).json({
							// ok
							schedules: results.rows,
						});
					}
				}
			);
		} else {
			res.status(403).json({ message: "Invalid Request" }); // forbidden
		}
	} catch (error) {
		res.status(500).json({
			// internal server error
			message: error.message,
		});
	}
}

async function postSchedule(req, res) {
	const logged_user = await methods.getLoggedUser(req);
	const indata = req.body;
	const isDoctor = await methods.CheckIsDoctor(req);
	try {
		if (isDoctor) {
			if ((indata.end_time - indata.start_time) / (1000 * 60 * 60) > 8)
				res.status(500).json({
					message: "Schedule cannot be longer than 8 hours.",
					success: false,
				});
			db.query(
				`INSERT INTO Schedule (doctor_id, allowed_patients, appointed_patients, start_time, end_time)
            values (${logged_user.user_id}, ${indata.allowed_patients}, ${0}, '${indata.start_time}', '${
					indata.end_time
				}')`,
				(error, results) => {
					if (error) {
						res.status(500).json(error.message);
					} else {
						res.status(200).json({
							message: "Schedule Created",
							success: true,
						});
					}
				}
			);
		} else {
			res.status(403).json({ message: "Invalid Request" });
		}
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
}

async function updateSchedule(req, res) {
	const logged_user = await methods.getLoggedUser(req);
	const inData = req.body;
	const isDoctor = await methods.CheckIsDoctor(req);
	const schedule = (await db.query(`SELECT * FROM Schedule WHERE schedule_id=${inData.schedule_id};`)).rows.at(0);
	try {
		if (isDoctor) {
			const currentTime = new Date();
			const scheduleTime = new Date(schedule.start_time.toISOString());
			if (currentTime > scheduleTime) {
				res.status(200).json({
					message: "Past schedules cannot be modified.",
					success: false,
				});
			}

			if (schedule.appointed_patients < inData.allowed_patients) {
				db.query(
					`UPDATE Schedule 
                SET allowed_patients=${inData.allowed_patients}
                WHERE schedule_id=${inData.schedule_id} AND doctor_id=${logged_user.user_id}
                AND start_time > NOW();`,
					(error, results) => {
						if (error) {
							res.status(500).json(error.message);
						} else {
							res.status(200).json({ message: "Schedule Updated", success: true });
						}
					}
				);
			} else {
				const updt = await db.query(`UPDATE Schedule 
                SET appointed_patients=${inData.allowed_patients}, allowed_patients=${inData.allowed_patients}
                WHERE schedule_id=${inData.schedule_id} AND doctor_id=${logged_user.user_id} 
                AND start_time > NOW();`);

				let patientsToBeRescheduled = schedule.appointed_patients - inData.allowed_patients;
				const resch = await reschedulePatients(schedule, patientsToBeRescheduled);
				res.status(resch.status).json({
					message: resch.message,
				});
			}
		} else {
			res.status(403).json({ message: "Invalid Request" });
		}
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
}

async function deleteSchedule(req, res) {
	const inData = req.body;
	const isDoctor = await methods.CheckIsDoctor(req);
	const schedule = (await db.query(`SELECT * FROM Schedule WHERE schedule_id=${inData.schedule_id};`)).rows.at(0);
	try {
		if (isDoctor) {
			const currentTime = new Date();
			const scheduleTime = new Date(schedule.start_time.toISOString());
			console.log("Time", currentTime > scheduleTime);
			if (currentTime > scheduleTime) {
				res.status(200).json({
					message: "Past schedules cannot be deleted.",
					success: false,
				});
				return;
			}

			let patientsToBeRescheduled = schedule.appointed_patients;
			const resch = await reschedulePatients(schedule, patientsToBeRescheduled);

			if (!resch.success) {
				res.status(resch.status).json({
					message: "Could not reschedule patient(s)!",
					success: false,
				});
				return;
			}
			db.query(
				`
            DELETE FROM Schedule WHERE schedule_id=${schedule.schedule_id};`,
				(error, results) => {
					if (error) {
						res.status(500).json({ message: error.message, success: false });
					} else {
						res.status(200).json({
							message: "Schedule Deleted",
							succe: true,
						});
					}
				}
			);
		} else {
			res.json({ message: "Invalid Request" });
		}
	} catch (error) {
		res.json({
			message: error.message,
		});
	}
}

async function reschedulePatients(schedule, patientsCount) {
	try {
		const patientsDescendingByTurn = (
			await db.query(`
        SELECT
        p.patient_name,
        p.appointment_date,
        p.schedule_id,
        p.turn,
        p.patient_id,
        u.email,
        u.name,
		d.name AS doctor_name,
		s.start_time
        FROM Patients p
        JOIN Users u ON u.user_id = p.user_id
		JOIN Schedule s ON s.schedule_id = p.schedule_id
		JOIN Users d ON d.user_id = s.doctor_id
        WHERE p.schedule_id=${schedule.schedule_id}
        ORDER BY p.turn DESC
        LIMIT ${patientsCount};
        `)
		).rows;

		const patients = Array.from(patientsDescendingByTurn).reverse();

		const next_schedules = (
			await db.query(`
        SELECT * FROM Schedule WHERE doctor_id=${schedule.doctor_id}
        AND start_time > '${schedule.start_time.toISOString()}';
        `)
		).rows;

		let rescheduled = 0,
			coveredInRounds = 0,
			toCoverInRound = 0,
			empty_slots = 0;

		for (let round = 0; round < next_schedules.length; round++) {
			empty_slots = next_schedules.at(round).allowed_patients - next_schedules.at(round).appointed_patients;

			for (; rescheduled < patientsCount && empty_slots; rescheduled++) {
				const inc_turn_P = await db.query(`
                UPDATE Patients
                SET turn = turn + 1
                WHERE schedule_id = ${next_schedules.at(round).schedule_id};
                `);

				toCoverInRound = empty_slots < patientsCount - rescheduled ? empty_slots : patientsCount - rescheduled;
				let index = coveredInRounds + toCoverInRound - 1;

				const currentPatient = patients.at(index);
				const reschedulePatient = await db.query(`
                UPDATE Patients
                SET schedule_id=${next_schedules.at(round).schedule_id}, turn=${1}
                WHERE patient_id=${currentPatient.patient_id}
                `);

				const emailData = {
					email: "crownab34@gmail.com", // patients email to be placed here
					subject: "Appointment Rescheduled",
					text: "",
					html: `
					<h4>Dear ${currentPatient.name},</h4>
                    <p>You are being informed you that an appointment with Dr. ${
						currentPatient.doctor_name
					} on ${methods.dateToString(currentPatient.start_time)} has been rescheduled:</p>

                    <div><strong>Patient Name:</strong> ${currentPatient.patient_name}</div>
                    <div><strong>User Name:</strong> ${currentPatient.name}</div>
                    <div><strong>Email:</strong> ${currentPatient.email}</div>
                    <div><strong>Booking Date:</strong> ${currentPatient.appointment_date}</div>

                    <p>Please note that you can always review or cancel your appointment by logging in to your account.</p>
                `,
				};
				sendMail(emailData);

				empty_slots--;
				methods.UpdateAppointedPatients(patients.at(index).schedule_id);
				methods.UpdateAppointedPatients(next_schedules.at(round).schedule_id);
			}
			coveredInRounds = rescheduled;
			if (rescheduled == patientsCount) break;
		}

		if (rescheduled < patientsCount) {
			for (let i = rescheduled; i < patientsCount; i++) {
				const currentPatient = patients.at(i);
				const deleteRemainingPatients = await db.query(
					`DELETE FROM Patients WHERE patient_id=${currentPatient.patient_id};`
				);
				const emailData = {
					email: "crownab34@gmail.com", // currentPatienthere
					subject: "Appointment Cancelled",
					text: "",
					html: `
                
                    <h4>Dear ${currentPatient.name},</h4>

                    <p>We regret to inform you that an appointment with Dr. ${
						currentPatient.doctor_name
					} on ${methods.dateToString(currentPatient.start_time)} has been cancelled:</p>

                    <div><strong>Patient Name:</strong> ${currentPatient.patient_name}</div>
                    <div><strong>User Name:</strong> ${currentPatient.name}</div>
                    <div><strong>Email:</strong> ${currentPatient.email}</div>
                    <div><strong>Booking Date:</strong> ${currentPatient.appointment_date}</div>

                    <p>We apologize for any inconvenience this may have caused.</p>
                `,
				};
				if (deleteRemainingPatients.rowCount) sendMail(emailData);
			}
		}

		return {
			success: true,
			status: 200,
			message: "Rescheduled",
		};
	} catch (error) {
		return {
			status: 500,
			message: error.message,
		};
	}
}

async function getAppointments(req, res) {
	const user = await methods.getLoggedUser(req);
	const isDoctor = await methods.CheckIsDoctor(req);
	if (!user) return null;
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
            s.doctor_id=${user.user_id};`);

			const response = {
				isDoctor: true,
				appointments: results.rows,
			};
			if (results.rowCount) res.status(200).json(response);
			else res.status(404).send("Not found");
		} else {
			let booked = {};
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
            p.user_id=${user.user_id};`);

			booked = booked_results.rows;
			for (const appn of booked) {
				let starttime = new Date(appn.start_time);
				let endtime = new Date(appn.end_time);
				const timeDiff = endtime - starttime; // milliseconds

				const minutes = Math.floor(timeDiff / 60000);
				let interval = minutes / appn.allowed_patients;
				let end_mins = interval * appn.turn;
				let start_mins = end_mins - interval;

				const start_interval = new Date(starttime.getTime() + start_mins * 60000);
				const end_interval = new Date(start_interval.getTime() + end_mins * 60000);

				appn.start_interval = start_interval;
				appn.end_interval = end_interval;

				delete appn.allowed_patients;
			}

			let available = {};
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
                AND s.start_time > NOW();`);

			available = available_results.rows;

			let response = {
				isDoctor: false,
				appointments: booked,
				available_slots: available,
			};
			if (booked_results.rowCount || available_results.rowCount) res.status(200).json(response);
			else res.status(404).send("Not found");
		}
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
}

async function postAppointment(req, res) {
	const user = await methods.getLoggedUser(req);
	const data = req.body;
	const isDoctor = await methods.CheckIsDoctor(req);
	const preCheckSchedule = await methods.UpdateAppointedPatients(data.schedule_id);
	try {
		if (!isDoctor) {
			const currentDate = new Date();
			let appdate = methods.dateToString(currentDate);

			let appointed_patients = (
				await db.query(`SELECT appointed_patients FROM Schedule WHERE schedule_id=${data.schedule_id};`)
			).rows.at(0).appointed_patients;
			let turn = parseInt(appointed_patients) + 1;
			const patient = {
				user_id: user.user_id,
				schedule_id: data.schedule_id,
				patient_name: data.patient_name,
				age: data.age,
				gender: data.gender,
				appointment_date: appdate,
				turn,
			};
			const response = await InsertPatient(patient);
			console.log(response);
			if (response.success) res.status(200).json(response);
			else res.status(500).send(response.message);
		} else {
			res.status(403).json({
				message: "Invalid Request!",
				success: false,
			});
		}
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
}

async function deleteAppointment(req, res) {
	const isDoctor = await methods.CheckIsDoctor(req);
	const data = req.body;

	if (isDoctor)
		res.status(403).json({
			message: "Invalid Request!",
			success: false,
		});
	try {
		const scheduleID = (
			await db.query(`SELECT schedule_id FROM Patients WHERE patient_id=${data.patient_id}`)
		).rows.at(0).schedule_id;
		db.query(
			`
        DELETE FROM Patients WHERE patient_id=${data.patient_id} 
        `,
			(error, results) => {
				if (error) {
					res.status(500).json({
						message: error.message,
						success: false,
					});
				} else {
					res.status(200).json({
						message: "Deleted Appointment",
						success: true,
					});
				}
			}
		);
		const patientsCount = await methods.UpdateAppointedPatients(scheduleID);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
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
						success: false,
					});
				} else {
					resolve({
						message: `Appointment booked for ${patient.patient_name}`,
						success: true,
					});
				}
			});
		});
		if (insertResult.success) {
			const incAppPatients = await methods.UpdateAppointedPatients(patient.schedule_id);
		}
		return insertResult;
	} catch (error) {
		return {
			message: error.message,
			success: false,
		};
	}
}

async function getProfile(req, res) {
	const user = await methods.getLoggedUser(req);
	const isDoctor = await methods.CheckIsDoctor(req);
	console.log(user);

	try {
		if (isDoctor) {
			console.log("doc:", isDoctor);
			const results = await db.query(`SELECT
            U.name AS name,
            U.email AS email,
            D.department,
            D.address,
            D.fee
            FROM Doctors AS D
            JOIN Users AS U ON D.doctor_id = U.user_id
            WHERE user_id=${user.user_id};`);
			if (results.rowCount) res.status(200).json(results.rows);
			else res.status(404).send("Not found");
		} else {
			db.query(`SELECT name, email FROM Users WHERE user_id=${user.user_id};`, (error, results) => {
				if (error) res.status(404).json(error.message);
				else {
					res.status(200).json(results.rows);
				}
			});
		}
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

async function updateProfile(req, res) {
	const user = await methods.getLoggedUser(req);
	const isDoctor = await methods.CheckIsDoctor(req);
	const indata = req.body;

	try {
		if (indata.password) {
			let newPass = await methods.encryptPassword(indata.password);
			const results = await db.query(`UPDATE Users
            SET name='${indata.name}', password='${newPass}'
            WHERE user_id=${user.user_id};`);
		} else {
			const results = await db.query(`UPDATE Users
            SET name='${indata.name}'
            WHERE user_id=${user.user_id};`);
		}

		if (isDoctor) {
			const results = await db.query(`UPDATE Doctors
            SET department='${indata.department}', address='${indata.address}', fee=${indata.fee}
            WHERE doctor_id=${user.user_id};`);
		}
		res.status(200).json({ message: "Profile Updated Successfully!" });
	} catch (error) {
		res.status(500).json({
			message: error.message,
		});
	}
}

module.exports = {
	getSchedule,
	postSchedule,
	updateSchedule,
	deleteSchedule,
	getAppointments,
	postAppointment,
	deleteAppointment,
	getProfile,
	updateProfile,
};
