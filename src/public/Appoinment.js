document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("appointment-form");

  form.addEventListener("submit", function(event) {
      event.preventDefault(); // Prevent the default form submission behavior

      const patientName = form.elements["patient-name"].value;
      const age = form.elements["age"].value;
      const gender = form.elements["gender"].value;
      
      console.log("Patient Name:", patientName);
      console.log("Age:", age);
      console.log("Gender:", gender);
      
      form.reset();
  });
});
