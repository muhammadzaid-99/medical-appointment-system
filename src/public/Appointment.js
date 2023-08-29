// Function to fetch and display appointments
function fetchAppointments() {
  fetch("/appointments")
    .then((response) => response.json())
    .then((data) => {
      // Assuming data structure is received as described
      if (data.isDoctor) {
        // Handle doctor data (data.appointments)
        const bookedAppointmentsTable = document.getElementById(
          "bookedAppointmentsTable"
        );
        bookedAppointmentsTable.innerHTML = `
        <thead>
        <tr>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Patient Name</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Appointment Date</th>
        </tr>
        </thead>
        <tbody></tbody>`;

        const appointments = data.appointments;

        for (const appointment of appointments) {
          const row = bookedAppointmentsTable.insertRow();

          const startTimeCell = row.insertCell();
          startTimeCell.textContent = appointment.start_time;

          const endTimeCell = row.insertCell();
          endTimeCell.textContent = appointment.end_time;

          const patientNameCell = row.insertCell();
          patientNameCell.textContent = appointment.patient_name;

          const ageCell = row.insertCell();
          ageCell.textContent = appointment.age;

          const genderCell = row.insertCell();
          genderCell.textContent = appointment.gender;

          const appointmentDateCell = row.insertCell();
          appointmentDateCell.textContent = appointment.appointment_date;
        }
      } else {
        // Handle user data (data.appointments and data.available_slots)
        const bookedAppointmentsTable = document.getElementById(
          "bookedAppointmentsTable"
        );
        bookedAppointmentsTable.innerHTML = `
        <thead>
        <tr>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Doctor Name</th>
          <th>Department</th>
          <th>Address</th>
          <th>Fee</th>
          <th>Patient Name</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Appointment Date</th>
        </tr>
        </thead>
        <tbody></tbody>`;

        const availableSlotsTable = document.getElementById('availableSlotsTable');
        availableSlotsTable.innerHTML = `
        <thead>
        <tr>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Doctor Name</th>
          <th>Address</th>
          <th>Fee</th>
          <th>Department</th>
        </tr>
        </thead>
        <tbody></tbody>`;

        const appointments = data.appointments;
        const availableSlots = data.available_slots;
        console.log("abc");
        console.log(appointments);

        for (const appointment of appointments) {
          const row = bookedAppointmentsTable.insertRow();

          const startTimeCell = row.insertCell();
          startTimeCell.textContent = appointment.start_time;

          const endTimeCell = row.insertCell();
          endTimeCell.textContent = appointment.end_time;

          const doctorNameCell = row.insertCell();
          doctorNameCell.textContent = appointment.doctor_name;

          const departmentCell = row.insertCell();
          departmentCell.textContent = appointment.department;

          const addressCell = row.insertCell();
          addressCell.textContent = appointment.address;

          const feeCell = row.insertCell();
          feeCell.textContent = appointment.fee;

          const patientNameCell = row.insertCell();
          patientNameCell.textContent = appointment.patient_name;

          const ageCell = row.insertCell();
          ageCell.textContent = appointment.age;

          const genderCell = row.insertCell();
          genderCell.textContent = appointment.gender;

          const appointmentDateCell = row.insertCell();
          appointmentDateCell.textContent = appointment.appointment_date;
        }

        for (const slot of availableSlots) {
          const row = availableSlotsTable.insertRow();

          const startTimeCell = row.insertCell();
          startTimeCell.textContent = slot.start_time;

          const endTimeCell = row.insertCell();
          endTimeCell.textContent = slot.end_time;

          const doctorNameCell = row.insertCell();
          doctorNameCell.textContent = slot.doctor_name;

          const addressCell = row.insertCell();
          addressCell.textContent = slot.address;

          const feeCell = row.insertCell();
          feeCell.textContent = slot.fee;

          const departmentCell = row.insertCell();
          departmentCell.textContent = slot.department;

          const bookAppointmentCell = row.insertCell(); 
          const bookButton = document.createElement("button");
          bookButton.textContent = "Book Appointment";
          bookButton.addEventListener("click", () => {
            window.location.href = `BookAppointment.html?slot=${slot.schedule_id}`;
          });
          bookAppointmentCell.appendChild(bookButton)
        }
      }
    })

    .catch((error) => {
      console.error("Error fetching appointments:", error);
    });
}

fetchAppointments();
