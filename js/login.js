/**
 * Loads and initializes the login page
 * Handles form submission and authentication
 */
async function loadLoginPage() {
    const loginview = document.getElementById("loginview");
    const postsContainer = document.getElementById("posts-container");
    const sidebar = document.querySelector(".sidebar");
    
    if (!loginview) {
        console.error("Error: Login view element not found.");
        return;
    }

    // Clear and prepare containers
    loginview.style.display = "flex";
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
    
    // Clear other content if those elements exist
    if (postsContainer) postsContainer.innerHTML = "";
    if (sidebar) sidebar.innerHTML = "";
    
    // Set up form submission handler
    document.getElementById("login-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const loginID = document.getElementById("loginID").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loginID, password }),
                credentials: 'include' // Allow cookies to be sent and received
            });

            const data = await response.json();

            if (response.ok) {
                // Navigate to home page on successful login
                history.pushState({}, '', '/home');
                handleRoute();
                connectWebSocket();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("Login failed. Please try again.");
        }
    });
}