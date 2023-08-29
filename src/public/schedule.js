function fetchSchedules() {
  fetch("/schedule")
    .then((response) => response.json())
    .then((data) => {
      const schedulesTable = document.getElementById("ScheduleTable");
      schedulesTable.innerHTML = `
        <thead>
          <tr>
            <th>Allowed Patients</th>
            <th>Appointed Patients</th>
            <th>Start Time</th>
            <th>End Time</th>
          </tr>
        </thead>
        <tbody></tbody>`;

      for (const schedule of data.schedules) {
        const row = schedulesTable.insertRow();

        const allowedPatientsCell = row.insertCell();
        allowedPatientsCell.textContent = schedule.allowed_patients;

        const appointedPatientsCell = row.insertCell();
        appointedPatientsCell.textContent = schedule.appointed_patients;

        const startTimeCell = row.insertCell();
        startTimeCell.textContent = schedule.start_time;

        const endTimeCell = row.insertCell();
        endTimeCell.textContent = schedule.end_time;
        }
      })
  
    .catch((error) => {
      console.error("Error fetching schedules:", error);
    });
}

// Fetch schedules when the page loads
fetchSchedules();
