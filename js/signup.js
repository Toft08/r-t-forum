function loadSignupPage() {
    history.pushState({}, '', '/signup');
    const loginview = document.getElementById('loginview');
    const signupview = document.getElementById('signupview');
    const navbar = document.getElementById("navbar");
    if (loginview) {
        loginview.innerHTML = '';
        loginview.style.display = 'none';
    }
    if (navbar) {
        navbar.style.display = "none";
    }

    signupview.innerHTML = `
    <h1>Sign Up</h1>
    <form id="signup-form">
            <div class="hover-icon">
                <span class="material-symbols-outlined" style="font-size: 20px; vertical-align: middle;">info</span>
                <span class="tooltip">Username must be 3-20 characters, letters, numbers, or _</span>
            </div>
        <label for="username">Username or Email</label>
        <input type="text" id="username" name="username" placeholder="Enter your username" required>

        <label for="firstname">First Name</label>
        <input type="text" id="firstname" name="firstname" placeholder="Enter your first name" required>

        <label for="lastname">Last Name</label>
        <input type="text" id="lastname" name="lastname" placeholder="Enter your last name" required>

        <label for="age">Age</label>
        <input type="number" id="age" name="age" min="1" max="120" placeholder="Enter your age" required>

        <label for="gender">Gender</label>
        <select id="gender" name="gender" required>
            <option value="" disabled selected>Select your gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
        </select>

        <label for="email">Email</label>
        <input type="text" id="email" name="email" placeholder="Enter your email" required>

        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required>

        <label for="confirmpassword">Confirm Password</label>
        <input type="password" id="confirmpassword" name="confirmpassword" placeholder="Confirm your password" required>

        <button type="submit">Sign Up</button>
    </form>
    <p>Already have an account? <a href="/login" id="login-link">Login</a></p>
    <p id="signupMessage"></p>
`;


    // Event listener for the form submission
    document.getElementById("signup-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent traditional form submission

        const username = document.getElementById("username").value.trim();
        const firstname = document.getElementById("firstname").value.trim();
        const lastname = document.getElementById("lastname").value.trim();
        const age = parseInt(document.getElementById("age").value);
        const gender = document.getElementById("gender").value;
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmpassword = document.getElementById("confirmpassword").value;

        const messageElement = document.getElementById("signupMessage");

        if (password !== confirmpassword) {
            messageElement.style.color = "red";
            messageElement.textContent = "Passwords do not match.";
            return;
        }

        const payload = {
            username,
            firstname,
            lastname,
            age,
            gender,
            email,
            password,
            confirmpassword
        };

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json(); // Parse JSON response

            const messageElement = document.getElementById("signupMessage");

            if (response.ok) {
                messageElement.style.color = "green";
                messageElement.textContent = "Signup successful! Redirecting...";
                window.location.href = "/login";
            } else {
                messageElement.style.color = "red";
                messageElement.textContent = result.error || "Signup failed.";
            }
        } catch (error) {
            console.error("Signup error:", error);
            const messageElement = document.getElementById("signupMessage");
            messageElement.style.color = "red";
            messageElement.textContent = "An error occurred. Please try again later.";
        }
    });
}