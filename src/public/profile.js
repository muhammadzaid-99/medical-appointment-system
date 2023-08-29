const profileView = document.querySelector('.profile-view');
const profileEdit = document.querySelector('.profile-edit');
const profileForm = document.getElementById('profile-form');

profileForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Fetch the updated profile information from the form
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const department = document.getElementById('department').value;
    const address = document.getElementById('address').value;
    const fee = document.getElementById('fee').value;
    const password = document.getElementById('password').value;

    // Update the profile information in the view section
    document.querySelector('.profile-view p:nth-child(1)').innerHTML = `<strong>Name:</strong> ${name}`;
    document.querySelector('.profile-view p:nth-child(2)').innerHTML = `<strong>Email:</strong> ${email}`;
    document.querySelector('.profile-view p:nth-child(3)').innerHTML = `<strong>Department:</strong> ${department}`;
    document.querySelector('.profile-view p:nth-child(4)').innerHTML = `<strong>Address:</strong> ${address}`;
    document.querySelector('.profile-view p:nth-child(5)').innerHTML = `<strong>Fee:</strong> ${fee} (Doctor)`;

    // Clear form fields
    profileForm.reset();

    // Hide the edit section and show the view section
    profileView.style.display = 'block';
    profileEdit.style.display = 'none';
});

// Toggle between view and edit sections
document.querySelector('.profile-view button').addEventListener('click', function() {
    profileView.style.display = 'none';
    profileEdit.style.display = 'block';
});
