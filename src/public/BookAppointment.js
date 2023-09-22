document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("appointment-form");

  form.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const patientName = form.elements["patient-name"].value;
    const age = form.elements["age"].value;
    const gender = form.elements["gender"].value;

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const slot = urlParams.get("slot");

    // Create an object to hold the appointment data
    const appointmentData = {
      patient_name: patientName,
      age: age,
      gender: gender,
      schedule_id: slot
    };
    console.log(appointmentData)

    try {
      // Send the appointment data to the backend server
      const response = await fetch("api/user/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });
      const responseData = await response.json();
      if (responseData.success) {
        alert(responseData.message);
        form.reset();

        window.location.href = "Appointment.html";
      } else {
        console.error("Failed to book appointment");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });
});
