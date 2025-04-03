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
        <p>Don't have an account? <a href="/signup" id="signup-link">Sign Up</a></p>
    `;
    console.log("Login page loaded");

    document.getElementById("login-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the form from submitting the traditional way

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        console.log("Attempting login with username:", username); // Debug log

        try {
            console.log("Sending fetch request to /login"); // Debug log
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            console.log("Response status:", response.status); // Debug log

            // Parse the response JSON
            const data = await response.json();

            console.log("Response data:", data); // Debug log

            if (response.ok) {
                // currentUsername = username;
                fetchPreviousMessages(username, 'other');
                fetchActiveUsers();
                // Handle successful login, redirect or load homepage content dynamically
                history.pushState({}, '', '/home');
                handleRoute();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error during login:", error);
        }
    });
}
