document.addEventListener("DOMContentLoaded", function() {
    const scheduleButton = document.getElementById("schedule-button");

    // Get the doctor status from the URL query parameter
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const isDoctor = urlParams.get('doctor');

    if (isDoctor === "true") {
        scheduleButton.style.display = 'block';
    } else {
        scheduleButton.style.display = 'none';
    }
});