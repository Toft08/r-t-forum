document.getElementById('signup-button').addEventListener('click', function () {
    console.log("Sign Up button clicked!");
    window.location.hash = 'signup'; // Change the URL to #signup
});

document.addEventListener('DOMContentLoaded', function () {
    handleRoute(); // Load the correct page on initial load
    window.addEventListener('hashchange', handleRoute); // Listen for hash changes

    fetch("/posts")
        .then((response) => response.json())
        .then((data) => insertPosts(data))
        .catch((error) => console.error("Error loading posts:", error));
});

function handleRoute() {
    const route = window.location.hash.substring(1); // Get the hash part (without #)
    const container = document.getElementById('content'); // Main content container

    // Check if we are in the signup or login route, otherwise load homepage content
    switch (route) {
        case 'signup':
            loadSignupPage(); // Load the signup page
            break;
        case 'login':
            loadLoginPage(); // Load the login page
            break;
        default:
            loadHomePage(); // Load the homepage
    }
}

function loadHomePage() {
    const container = document.getElementById('content');
    container.innerHTML = `
        <h1>Home</h1>
        <div id="posts-container"></div>
    `;

    // Add the Sign Up button on the home page
    const signupButton = document.createElement('button');
    signupButton.id = 'signup-button';
    signupButton.textContent = 'Sign Up';
    signupButton.addEventListener('click', function () {
        window.location.hash = 'signup';
    });

    container.appendChild(signupButton); // Append the Sign Up button

    // Load posts from the backend
    fetch("/posts")
        .then((response) => response.json())
        .then((data) => insertPosts(data))
        .catch((error) => console.error("Error loading posts:", error));
}

function loadSignupPage() {
    const container = document.getElementById('content');
    container.innerHTML = `
        <h1>Sign Up</h1>
        <form id="signup-form">
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
    `;

    // Event listener for the form submission
    document.getElementById("signup-form").addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent traditional form submission

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
    
            const result = await response.json(); // Parse JSON response
    
            const messageElement = document.getElementById("signupMessage");
            
            if (response.ok) {
                messageElement.style.color = "green";
                messageElement.textContent = "Signup successful! Redirecting...";
                setTimeout(() => window.location.hash = 'login', 2000); // Redirect to login page after a short delay
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

function loadLoginPage() {
    const container = document.getElementById('content');
    container.innerHTML = `
        <h1>Login</h1>
        <form id="login-form">
            <label for="email">Email</label>
            <input type="text" id="email" name="email" placeholder="Enter your email" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required>

            <button type="submit">Login</button>
        </form>
    `;
}

function insertPosts(posts) {
    const container = document.getElementById('posts-container');
    container.innerHTML = ''; // Clear container first

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }

    posts.forEach((post) => {
        const categoriesArray = post.categories ? post.categories.split(',') : [];
        const categoriesText = categoriesArray.length > 0 ? categoriesArray.join(', ') : 'No categories';

        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.innerHTML = `
            <div class="post-header">
                <span>Posted by: ${post.username}</span>
                <span>${formatDate(post.created_at)}</span>
            </div>
            <div class="post-title">${post.post_title}</div>
            <div class="post-content">${post.post_content}</div>
            <div class="post-footer">
                <div class="categories">Categories: ${categoriesText}</div>
                <div class="post-stats">
                    <div class="likes">
                        <span class="material-symbols-outlined">thumb_up</span>
                        ${post.likes}
                    </div>
                    <div class="dislikes">
                        <span class="material-symbols-outlined">thumb_down</span>
                        ${post.dislikes}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(postElement);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        const parts = dateString.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
        if (parts) {
            const year = parseInt(parts[1]);
            const month = parseInt(parts[2]) - 1;
            const day = parseInt(parts[3]);
            const hour = parseInt(parts[4]);
            const minute = parseInt(parts[5]);
            const second = parseInt(parts[6]);

            const formattedDate = new Date(year, month, day, hour, minute, second);
            return formattedDate.toLocaleString();
        }
        return dateString;
    }

    return date.toLocaleString();
}
