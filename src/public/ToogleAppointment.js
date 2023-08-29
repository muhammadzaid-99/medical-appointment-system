document.addEventListener("DOMContentLoaded", function() {
    const appointmentForm = document.getElementById("appointment-form");

    // Get the patient status from the URL query parameter
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const isDoctor = urlParams.get('doctor');

    if (isDoctor === "true") {
        appointmentForm.style.display = 'none';
    } else {
        appointmentForm.style.display = 'block';
    }
});
   