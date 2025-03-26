document.getElementById('signup-button').addEventListener('click', function () {
    console.log("Log in button clicked!");
    history.pushState({}, '', '/login');
    loadLoginPage();
});

function loadLoginPage() {
    console.log("loading login page")
    const container = document.getElementById('content');
    container.innerHTML = `
        <h1>Login</h1>
        <form id="login-form">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="Enter your username" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required>

            <button type="submit">Login</button>
        </form>
    `;
    console.log("Loading homepage content...");
}

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
            loadHomePage(); 
        } else {
            // Show the error message (e.g., invalid username/password)
            alert(data.error);
        }
    })
    .catch(error => {
        console.error("Error during login:", error);
    });
});
