async function loadLoginPage() {
    console.log("loading login page")

    const loginview = document.getElementById("loginview");
    const postsContainer = document.getElementById("posts-container");
    const sidebar = document.querySelector(".sidebar");
    const navbar = document.getElementById("navbar");
    if (navbar) {
        navbar.style.display = "none"; // Hide the navbar
    }
    if (!loginview || !postsContainer || !sidebar) {
        console.error("Error: Required elements not found.");
        return;
    }

    // Clear other content
    loginview.innerHTML = ""
    loginview.style.display = "flex";
    postsContainer.innerHTML = "";
    sidebar.innerHTML = "";

    if (loginview) {
        loginview.style.display = "flex";
    }
    
    loginview.innerHTML = `
        <h1>Login</h1>
        <form id="login-form">
            <label for="username">Username or Email</label>
            <input type="text" id="loginID" name="username" placeholder="Enter your username" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required>

            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="/signup" id="signup-link">Sign Up</a></p>
    `;
    console.log("Login page loaded");
    
    document.getElementById("login-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the form from submitting the traditional way

        const loginID = document.getElementById("loginID").value;
        const password = document.getElementById("password").value;

        console.log("Attempting login with username:", loginID); // Debug log

        try {
            console.log("Sending fetch request to /login"); // Debug log
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loginID, password }),
                // include allows credentials to allow cookies to be sent and recieved
                credentials: 'include'
            });

            // Parse the response JSON
            const data = await response.json();

            if (response.ok) {
                // Handle successful login, redirect or load homepage content dynamically
                history.pushState({}, '', '/home');
                handleRoute();
                connectWebSocket()
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error during login:", error);
        }
    });
}
