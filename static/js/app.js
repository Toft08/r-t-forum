import { initRouter } from './router.js';
import { checkAuthStatus } from './auth.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    const isLoggedIn = await checkAuthStatus();
    
    // Initialize router with initial route
    initRouter(isLoggedIn ? 'main' : 'login');
    
    // Hide loading indicator
    document.getElementById('loading').classList.add('hidden');
});

// document.addEventListener("DOMContentLoaded", () => {
//     navigate('home'); // Load home by default
// });

// function navigate(page) {
//     const app = document.getElementById("app");
//     switch (page) {
//         case "home":
//             app.innerHTML = `
//                 <h2>Latest Posts</h2>
//                 <button onclick="navigate('createPost')">New Post</button>
//                 <div id="posts"></div>
//             `;
//             loadPosts();
//             break;

//         case "createPost":
//             app.innerHTML = `
//                 <h2>Create a Post</h2>
//                 <form id="postForm">
//                     <input type="text" id="postTitle" placeholder="Post Title" required>
//                     <textarea id="postContent" placeholder="Write something..." required></textarea>
//                     <button type="submit">Submit</button>
//                 </form>
//             `;
//             document.getElementById("postForm").addEventListener("submit", submitPost);
//             break;

//         case "login":
//             app.innerHTML = `
//                 <h2>Login</h2>
//                 <form id="loginForm">
//                     <input type="text" id="username" placeholder="Username" required>
//                     <input type="password" id="password" placeholder="Password" required>
//                     <button type="submit">Login</button>
//                 </form>
//             `;
//             document.getElementById("loginForm").addEventListener("submit", handleLogin);
//             break;
//     }
// }

// // Load posts dynamically
// function loadPosts() {
//     fetch("/api/posts")
//         .then(response => response.json())
//         .then(posts => {
//             const postsContainer = document.getElementById("posts");
//             postsContainer.innerHTML = posts.map(post =>
//                 `<div class="post">
//                     <h3>${post.title}</h3>
//                     <p>${post.content}</p>
//                     <button onclick="viewPost(${post.id})">View</button>
//                 </div>`
//             ).join("");
//         })
//         .catch(error => console.error("Error loading posts:", error));
// }

// // Handle creating a post
// function submitPost(event) {
//     event.preventDefault();
//     const title = document.getElementById("postTitle").value;
//     const content = document.getElementById("postContent").value;

//     fetch("/api/create-post", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ title, content })
//     })
//     .then(response => response.json())
//     .then(() => navigate('home')) // Redirect to home after submission
//     .catch(error => console.error("Error submitting post:", error));
// }

// // Handle login
// function handleLogin(event) {
//     event.preventDefault();
//     const username = document.getElementById("username").value;
//     const password = document.getElementById("password").value;

//     fetch("/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password })
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             navigate('home');
//         } else {
//             alert("Login failed!");
//         }
//     })
//     .catch(error => console.error("Error logging in:", error));
// }
