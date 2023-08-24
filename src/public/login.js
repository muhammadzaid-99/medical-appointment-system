document.addEventListener("DOMContentLoaded", async function() {
    const form = document.querySelector("#login-form");
    const loginBtn = document.getElementById("login-btn");

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please fill in both email and password.");
            return;
        }

        const userData = {
            email,
            password
        };

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            console.log('Login result:', result.message);

            if (result.success) {
                // Check if the user is a doctor

                if (result.isDoctor) {
                    // Show the "Schedule" button for doctors
                    const scheduleButton = document.getElementById("schedule-button");
                    scheduleButton.style.display = 'block';
                } // move this code to home.js
                // const {doctor} = Qs.parse(location.search, {
                //     ignoreQueryPrefix: true
                // })

                // Redirect to the main page after successful login
                window.location.href = `/Home.html?doctor=${result.isDoctor}`;
            } else {
                alert("Invalid email or password. Please try again.");
            }
        } catch (error) {
            console.error('Error:', error);
            // Handle errors (e.g., display error messages)
        }
    });
});



