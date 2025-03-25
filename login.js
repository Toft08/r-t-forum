document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Send the login request to the backend
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
        })

    .then(response => response.json())
    .then(data => {
        if (data.message === "Login successful") {
            // Handle successful login, redirect or load homepage content dynamically
            loadHomePage(); // Replace with your logic to load the homepage dynamically
        } else {
            // Show the error message (e.g., invalid username/password)
            alert(data.error);
        }
    })
    .catch(error => {
        console.error("Error during login:", error);
    });
});

// Function to dynamically load homepage (you can update your SPA content here)
function loadHomePage() {
    // This is where you would update your SPA to show the homepage without refreshing
    console.log("Loading homepage content...");
    const contentContainer = document.getElementById("content"); // Ensure you have a container for content
    // Example: Update the DOM with homepage content
}
