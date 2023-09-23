const jwt = require("jsonwebtoken");
const db = require("../database/db");
const bcrypt = require("bcrypt");

// HAS TO BE IMPROVED USING A NEW USERID COOKIE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
async function getLoggedUser(req) {
	// no export
	try {
		let logged_id = jwt.decode(req.cookies.login).payload;
		const results = await db.query(`SELECT * FROM Users WHERE user_id=${logged_id};`);
		if (results.rows.length > 0) {
			return results.rows.at(0);
		} else {
			return null; // No user found
		}
	} catch (error) {
		return null;
	}
}

function dateToString(date) {
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // Note: Months are zero-based
	const day = date.getDate();

	let str = `${year}-${month}-${day}`;
	return str;
}

// async function getUserData(req, res) {
//     let user = await getLoggedUser(req)
//     res.json({
//         name: user.name,
//         email: user.email,
//     })
// }

async function encryptPassword(password) {
	let hashed_password = await bcrypt.hash(password, 10);
	return hashed_password;
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

async function CheckIsDoctor(req) {
	if (req.cookies.usertype) {
		let usertype = jwt.decode(req.cookies.usertype).payload;
		if (usertype)
			//doctor: 1
			return true;
	} else {
		let user = await getLoggedUser(req);

		const results = await db.query(`SELECT * FROM Doctors WHERE doctor_id='${user.user_id}';`);

		if (results.rowCount == 1) {
			return true;
		}
	}
	return false;
}

async function UpdateAppointedPatients(schedule_id) {
	try {
		const count = (
			await db.query(`
        SELECT COUNT(*)
        FROM Patients
        WHERE schedule_id = ${schedule_id};
        `)
		).rows.at(0).count;
		console.log(count);
		const updt = await db.query(`
        UPDATE Schedule
        SET appointed_patients = ${count}
        WHERE schedule_id=${schedule_id}
        ;`);
		return {
			success: true,
			message: "Done",
		};
	} catch (error) {
		return {
			success: false,
			message: error.message,
		};
	}
}

async function UpdateAnswerCount(question_id) {
	try {
		const count = (
			await db.query(`
        SELECT COUNT(*)
        FROM Answers
        WHERE question_id = ${question_id};
        `)
		).rows.at(0).count;
		console.log(count);
		const updt = await db.query(`
        UPDATE Questions
        SET answers_count = ${count}
        WHERE question_id=${question_id}
        ;`);
		return {
			success: true,
			message: "Done",
		};
	} catch (error) {
		return {
			success: false,
			message: error.message,
		};
	}
}

module.exports = {
	getLoggedUser,
	getUserByEmail,
	encryptPassword,
	CheckIsDoctor,
	dateToString,
	UpdateAppointedPatients,
	UpdateAnswerCount,
};
