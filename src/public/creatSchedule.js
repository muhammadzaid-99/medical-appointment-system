document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("schedule-form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const allowedPatients = form.elements["allowed_patients"].value;
    const startTimeInput = form.elements["start_time"].value;
    const endTimeInput = form.elements["end_time"].value;

    
    // Get the selected start and end times
    // const startTime = new Date(startTimeInput.value);
    // const endTime = new Date(endTimeInput.value);
    
    // // Get the timezone offset in minutes
    // const timezoneOffset = startTime.getTimezoneOffset();
    // console.log(appendTimezone(startTime));

    // // Adjust start and end times with timezone offset
    // startTime.setMinutes(startTime.getMinutes() - timezoneOffset);
    // endTime.setMinutes(endTime.getMinutes() - timezoneOffset);

    // // Convert adjusted times back to ISO string format
    // const adjustedStartTime = startTime.toISOString();
    // const adjustedEndTime = endTime.toISOString();
    const scheduleData = {
      start_time: startTimeInput,
      end_time: endTimeInput,
      allowed_patients: allowedPatients,
    };
    console.log(scheduleData);

    try {
      const response = await fetch("schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });
      const responseData = await response.json();
      if (responseData.success) {
        alert(responseData.message);
        form.reset();

        window.location.href = "Schedule.html";
      } else {
        alert(responseData.message);
        console.error("Failed to create schedule");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });
});

function appendTimezone(date) {
    const timezoneOffset = date.getTimezoneOffset();
    const timezoneOffsetHours = Math.abs(Math.floor(timezoneOffset / 60));
    const timezoneOffsetMinutes = Math.abs(timezoneOffset % 60);
    const timezone = timezoneOffset >= 0 ? `+${timezoneOffsetHours}:${timezoneOffsetMinutes}` : `-${timezoneOffsetHours}:${timezoneOffsetMinutes}`;
    
    const timezoneString = `T00:00:00${timezone}`;
    return date.toISOString().replace("T00:00:00", timezoneString);
  }