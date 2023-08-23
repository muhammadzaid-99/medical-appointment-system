document.addEventListener("DOMContentLoaded", function() {
    const doctors = [
      { id: "dr4", name: "Doctor 4", shiftStart: "09:00", shiftEnd: "17:00" },
      { id: "dr5", name: "Doctor 5", shiftStart: "08:00", shiftEnd: "16:00" },
      // Add more doctors here
    ];
  
    const appointmentSlotsPerDay = 5; // Maximum appointments per day per doctor
  
    const doctorSelect = document.getElementById("doctorSelect");
    const calendarBody = document.querySelector(".calendar-body");
    const selectedDoctor = document.getElementById("selectedDoctor");
    const timeSlots = document.querySelector(".time-slots");
    const bookButton = document.getElementById("bookButton");
  
    // Populate the doctor select options
    doctors.forEach(doctor => {
      const option = document.createElement("option");
      option.value = doctor.id;
      option.textContent = doctor.name;
      doctorSelect.appendChild(option);
    });
  
    // Event listener for doctor selection
    doctorSelect.addEventListener("change", function() {
      const selectedDoctorId = doctorSelect.value;
      const selectedDoctorInfo = doctors.find(doctor => doctor.id === selectedDoctorId);
  
      if (selectedDoctorInfo) {
        selectedDoctor.textContent = selectedDoctorInfo.name;
        populateTimeSlots(selectedDoctorInfo);
        bookButton.disabled = true;
      }
    });
  
    // Function to populate time slots
    function populateTimeSlots(doctor) {
      timeSlots.innerHTML = "";
      
      for (let i = 0; i < appointmentSlotsPerDay; i++) {
        const startTime = addMinutes(doctor.shiftStart, i * 30);
        const endTime = addMinutes(startTime, 30);
        
        const timeSlot = document.createElement("div");
        timeSlot.classList.add("time-slot");
        timeSlot.textContent = `${startTime} - ${endTime}`;
        timeSlot.dataset.start = startTime;
        timeSlot.dataset.end = endTime;
  
        timeSlot.addEventListener("click", function() {
          timeSlots.querySelectorAll(".time-slot").forEach(slot => {
            slot.classList.remove("selected");
          });
          timeSlot.classList.add("selected");
          bookButton.disabled = false;
        });
  
        timeSlots.appendChild(timeSlot);
      }
    }
  
    // Function to add minutes to a time
    function addMinutes(time, minutes) {
      const [hours, mins] = time.split(":").map(Number);
      const totalMinutes = hours * 60 + mins + minutes;
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      return `${padZero(newHours)}:${padZero(newMins)}`;
    }
  
    // Function to pad a number with leading zeros
    function padZero(num) {
      return num.toString().padStart(2, "0");
    }
  });
  