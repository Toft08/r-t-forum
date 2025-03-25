function loadSignupPage() {
    document.getElementById("content").innerHTML = `
        <h1>Sign Up</h1>
        <form id="signupForm">
            <label for="username">Username
                <div class="hover-icon">
                    <span class="material-symbols-outlined" style="font-size: 20px; vertical-align: middle;">info</span>
                    <span class="tooltip">Username must be 3-20 characters, letters, numbers, or _</span>
                </div>
            </label>
            <input type="text" id="username" name="username" placeholder="Enter your username" required>

            <label for="email">Email</label>
            <input type="text" id="email" name="email" placeholder="Enter your email" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required>

            <button type="submit">Sign Up</button>
        </form>

        <p id="signupMessage"></p>
    `;

    document.getElementById("signupForm").addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent traditional form submission

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const response = await fetch("/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();
        const messageElement = document.getElementById("signupMessage");

        if (response.ok) {
            messageElement.style.color = "green";
            messageElement.textContent = "Signup successful! Redirecting...";
            setTimeout(() => loadLoginPage(), 2000); // Redirect to login page
        } else {
            messageElement.style.color = "red";
            messageElement.textContent = result.error || "Signup failed.";
        }
    });
}
