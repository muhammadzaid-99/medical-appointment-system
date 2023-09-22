document.addEventListener("DOMContentLoaded", function() {
    const isDoctorCheckbox = document.getElementById("isDoctor");
    const doctorOnlyFields = document.querySelector(".doctor-only-fields");
  
    isDoctorCheckbox.addEventListener("change", function() {
        if (isDoctorCheckbox.checked) {
            doctorOnlyFields.style.display = "block";
        } else {
            doctorOnlyFields.style.display = "none";
        }
    });

    const form = document.querySelector("form");
    const signupBtn = document.getElementById("signup-btn");

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const isDoctor = isDoctorCheckbox.checked;
        const department = isDoctor ? document.getElementById("department").value : null;
        const address = isDoctor ? document.getElementById("address").value : null;
        const fee = isDoctor ? parseFloat(document.getElementById("fee").value) : null;

        if (!name || !email || !password || !confirmPassword) {
            alert("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const userData = {
            name,
            email,
            password,
            isDoctor,
            department,
            address,
            fee
        };

        try {
            const response = await fetch('api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            alert('Signup result:', result);
            // Handle the response from the server (e.g., redirect, display messages)
        } catch (error) {
            alert('Error:', error);
            // Handle errors (e.g., display error messages)
        }
    });
});
