
document.addEventListener("DOMContentLoaded", function() {
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
                // Redirect to the main page after successful login
                window.location.href = '/Home.html';
            } else {
                alert("Invalid email or password. Please try again.");
            }
        } catch (error) {
            console.error('Error:', error);
            // Handle errors (e.g., display error messages)
        }
    });
});


