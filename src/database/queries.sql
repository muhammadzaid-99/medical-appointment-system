-- help: \?
-- list of databases: \l
-- list of tables/relations: \d
-- view table/relation: \d <table_name>
-- view all functions: \df

CREATE DATABASE <dbname> --(create database)
DROP DATABASE <dbname> --(delete database)
DROP TABLE <table_name> --(delete table)
ALTER TABLE <table_name> ADD COLUMN <column_name> <data_type>; --(add new column)
ALTER TABLE <table_name> DROP COLUMN <column_name>; --(delete a column)


-- CHECK CONSTRAINTS
SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'your_table_name'::regclass;


CREATE TABLE products (
    id INT,
    name VARCHAR(32), -- or alternatively TEXT type
    price INT,
    on_sale BOOLEAN
);
INSERT INTO restaurants (id, name, location, price_range) values (123, 'KFC', 'LHR', 2);

--
CREATE TABLE rests (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(32) NOT NULL,
    location VARCHAR(32) NOT NULL,
    price_range INT NOT NULL check(price_range >= 1 AND price_range <= 5)
);
INSERT INTO rests (name, location, price_range) values ('KFC', 'LHR', 2);


--------- APPOINTMENT SYSTEM
CREATE TABLE Users (
    user_id BIGSERIAL NOT NULL PRIMARY KEY, --automatic
    name VARCHAR(64) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL check(email LIKE '%_@__%.__%'),
    password VARCHAR(128) NOT NULL
);

CREATE TABLE Doctors (
    doctor_id INT REFERENCES Users(user_id) NOT NULL PRIMARY KEY,
    department VARCHAR(32) NOT NULL,
    address VARCHAR(32) NOT NULL,
    fee INT NOT NULL
);

CREATE TABLE Schedule (
    schedule_id BIGSERIAL NOT NULL PRIMARY KEY, --automatic
    doctor_id INT REFERENCES Doctors(doctor_id), --doctor
    allowed_patients INT NOT NULL check(appointed_patients <= allowed_patients),
    appointed_patients INT check(appointed_patients <= allowed_patients),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL -- like '2004-10-19 10:23:54+02'
);

CREATE TABLE Patients (
    patient_id BIGSERIAL NOT NULL PRIMARY KEY, --automatic
    user_id INT REFERENCES Users(user_id),  --user
    schedule_id INT REFERENCES Schedule(schedule_id), --schedule
    patient_name VARCHAR(64) NOT NULL,
    age INT NOT NULL, 
    gender CHARACTER(1) NOT NULL check(gender IN ('M', 'F', 'O')),
    appointment_date DATE NOT NULL --'format: 1999-01-08 requires casting ::DATE'
);

insert into Users (name, email, password) values ('Umair', 'ghi@gmail.com', '123');
insert into Doctors (doctor_id, department, address, fee) values (4, 'cardiology', 'ABC123', 789);
insert into Schedule (doctor_id, allowed_patients, appointed_patients, start_time, end_time) values (4, 5, 0, '2023-08-17 10:00:00+05', '2023-08-17 11:00:00+05');

insert into Patients (user_id, schedule_id, patient_name, age, gender, appointment_date) 
SELECT * FROM (
    values (3, 2, 'patient2', 20, 'F', '2023-08-16'::DATE)
) AS i(user_id, schedule_id, patient_name, age, gender, appointment_date)
WHERE NOT EXISTS (
   SELECT FROM Schedule sc
   WHERE  sc.schedule_id = i.schedule_id
   AND    sc.allowed_patients = sc.appointed_patients
);

-- TIME CONSTRAINT
ALTER TABLE events
ADD CONSTRAINT check_future_event_timestamp
CHECK (event_timestamp > CURRENT_TIMESTAMP);

--- TO GET DOCTOR INFO COMPLETE

SELECT
    D.doctor_id,
    U.name AS user_name,
    U.email AS user_email,
    D.department,
    D.address,
    D.fee
FROM Doctors AS D
JOIN Users AS U ON D.doctor_id = U.user_id;



--- *******     ON PATIENT INSERT,INCREMENT IN SCHEDULE 
  
-- CREATE OR REPLACE FUNCTION increment_appointed_patients(schedule_id_param INT)
-- RETURNS void AS $$
-- BEGIN
--     UPDATE Schedule
--     SET appointed_patients = appointed_patients + 1
--     WHERE schedule_id = schedule_id_param;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER patient_insert
-- BEFORE INSERT ON Patients
-- FOR EACH ROW
-- EXECUTE FUNCTION increment_appointed_patients(NEW.schedule_id);

INSERT INTO Patients (name, age, ...)
            VALUES(...)
WHERE NOT EXISTS (
   SELECT FROM Schedule sc
   WHERE  sc.schedule_id = schedule_id
   AND    allowed_patients = appointed_patients
);




SELECT
    S.allowed_patients
    S.appointed_patients
    S.start_time
    S.end_time
    P.patient_name AS patient_name,
    P.age AS patient_age,
    P.gender AS patient_gender
    P.appointment_date AS patient_appointment_date
FROM Schedule AS S
JOIN Patients AS P ON S.schedule_id = P.schedule_id;




SELECT
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
    s.doctor_id=${user.user_id};


-- check constraints
    SELECT conname AS constraint_name,
       conrelid::regclass AS table_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE confrelid = 'Schedule'::regclass;
--
SELECT conname AS constraint_name,
       conrelid::regclass AS table_name,
       pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE confrelid = 'Schedule'::regclass
  AND contype = 'c';

