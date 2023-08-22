document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector("form");
    const loginBtn = document.getElementById("login-btn");

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please fill in both email and password.");
            return;
        }
        if (email === "user@example.com" && password === "password123") {
            alert("Login successful!");
        } else {
            alert("Invalid email or password. Please try again.");
        }
    });
});

