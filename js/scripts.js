document.addEventListener("DOMContentLoaded", function () {
  handleRoute(); // Load the correct page on initial load
  isLoggedIn();
  window.addEventListener("hashchange", handleRoute); // Listen for hash changes
});

function handleRoute() {
  const route = window.location.pathname; // Get the hash part (without #)
  const container = document.getElementById("content");
  container.innerHTML = ""; // Clear the container

  const publicRoutes = ["/login", "/signup"];
  isLoggedIn().then((loggedIn) => {
    // If not logged in, restrict navigation to only login and signup pages
    if (!loggedIn) {
      // If trying to access a route other than login or signup, redirect to login
      if (!publicRoutes.includes(route)) {
        history.pushState({}, "", "/login");
        loadLoginPage();
        return;
      }
    }

    // Check if we are in the signup or login route, otherwise load homepage content
    switch (route) {
      case "/":
        if (loggedIn) {
          history.pushState({}, "", "/home");
          loadHomePage();
        } else {
          history.pushState({}, "", "/login");
          loadLoginPage();
        }
        break;
      case "/login":
        loadLoginPage(); // Load the login page
        break;
      case "/signup":
        loadSignupPage(); // Load the signup page
        break;
      case "/home":
        if (loggedIn) {
          loadHomePage(); // Load the homepage
        } else {
          history.pushState({}, "", "/login");
          loadLoginPage(); // Redirect to login if not logged in
        }
        break;
      default:
        // For any unknown route when not logged in
        if (!loggedIn) {
          history.pushState({}, "", "/login");
          loadLoginPage();
        } else {
          console.error("Unknown page:", route);
          container.innerHTML = "<h1>404 - Page Not Found</h1>";
        }
    }
  });
}

function updateUsernameDisplay(username) {
  const welcomeText = document.getElementById("username-placeholder");
  if (welcomeText) {
    welcomeText.textContent = username || "Guest";
  }
}
function isLoggedIn() {
  // Send an API request to check if the session is valid
  return fetch("/api/check-session")
    .then((response) => response.json())
    .then((data) => {
      if (data.loggedIn) {
        updateUsernameDisplay(data.username);
      }
      return data.loggedIn;
    })
    .catch((err) => {
      console.error("Error checking session:", err);
      return false;
    });
}

function loadHomePage() {
  if (!isLoggedIn()) {
    console.error("Unauthorized access to home page");
    history.pushState({}, "", "/login");
    loadLoginPage();
    return;
  }

  const container = document.getElementById("content");
  container.innerHTML = `
      <h1>Home</h1>
  <div> <button id="create-post-btn">Create Post</button></div>
      <div id="posts-container"></div>
  `;

  // Create post popup window.
  const createPostBtn = document.getElementById("create-post-btn");
  const createPostPopup = document.getElementById("create-post-popup");

  // Create popup content dynamically
  const createPopupContent = () => {
    createPostPopup.innerHTML = `
              <h2>Create a new post</h2>
              <form id="create-form" action="/create" method="POST">
                  <label for="title">Title</label>
                  <input type="text" id="title" name="title" required maxlength="50">
                  <br>
                  <label for="content">Content:</label>
                  <textarea class="content-textarea" id="content" name="content" required></textarea>
                  <br>
                  <label for="categories">Categories</label>
                  <input type="text" id="categories" name="categories" required>
                  <br>
                  <button type="submit">Create</button>
              </form>
              <button id="close-popup-btn" class="close-button">Close</button>
          `;

    const closePopupBtn = document.getElementById("close-popup-btn");
    const createForm = createPostPopup.querySelector("#create-form");

    closePopupBtn.addEventListener("click", () => {
      createPostPopup.classList.add("hidden");
    });

    createForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createPostPopup.classList.add("hidden");
    });
  };

  // Show popup when create post button is clicked
  createPostBtn.addEventListener("click", () => {
    // Create popup content if not already created
    if (createPostPopup.innerHTML.trim() === "") {
      createPopupContent();
    }

    // Show popup
    createPostPopup.classList.remove("hidden");
  });

  fetch("/api/posts")
    .then((response) => response.json())
    .then((posts) => {
      console.log("Received posts:", posts);
      insertPosts(posts);
    })
    .catch((error) => {
      console.error("Error loading posts:", error);
      const container = document.getElementById("posts-container");
      container.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    });
}

function insertPosts(posts) {
  const container = document.getElementById("posts-container");
  container.innerHTML = ""; // Clear container first

  if (!posts || posts.length === 0) {
    container.innerHTML = "<p>No posts found.</p>";
    return;
  }

  posts.forEach((post) => {
    const categoriesArray = post.categories ? post.categories.split(",") : [];
    const uniqueCategories = [...new Set(categoriesArray)];
    const categoriesText =
      uniqueCategories.length > 0
        ? uniqueCategories.join(", ")
        : "No categories";

    const postElement = document.createElement("div");
    postElement.className = "post-card";
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
  if (!dateString) return "Unknown date";

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
function fetchActiveUsers() {
  fetch("/api/active-users")
    .then((response) => response.json())
    .then((users) => {
      const userList = document.getElementById("active-users-list");
      userList.innerHTML = ""; // Clear old users

      users.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user;
        li.style.cursor = "pointer";
        li.onclick = () => openChat(user); // Open chat when user is clicked

        userList.appendChild(li);
      });
    })
    .catch((error) => console.error("Error fetching active users:", error));
}
function openChat(username) {
  const chatWindow = document.getElementById("chat-window");
  if (!chatWindow) {
    console.error("Chat window element not found!");
    return;
  }
  chatWindow.style.display = "block";
  chatWindow.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>Chat with ${username}</h3>
        <button onclick="closeChat()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
      </div>
      <div id="chat-messages" style="height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
      <input type="text" id="chat-input" placeholder="Type a message...">
      <button onclick="sendMessage('${username}')">Send</button>
  `;

  // Open WebSocket connection
  connectWebSocket(username);
}

function closeChat() {
  const chatWindow = document.getElementById("chat-window");
  if (chatWindow) {
    chatWindow.style.display = "none";
  }
  if (ws) {
    ws.close(); // Close WebSocket connection
    ws = null; // Reset WebSocket variable
  }
}
let ws;

function connectWebSocket(username) {
  if (ws) {
    ws.close(); // Close previous connection
  }

  ws = new WebSocket(`ws://localhost:8080/api/ws/chat?username=${username}`);

  ws.onmessage = (event) => {
    const chatMessages = document.getElementById("chat-messages");
    const message = document.createElement("div");
    message.textContent = event.data;
    chatMessages.appendChild(message);
  };
}
function sendMessage(username) {
  const input = document.getElementById("chat-input");
  if (ws && ws.readyState === WebSocket.OPEN && input.value.trim()) {
    const msg = JSON.stringify({
      from: currentUsername, // Current user sending the message
      to: username, // Recipient username
      message: input.value,
    });

    console.log("Sending message:", msg);
    ws.send(msg);
    input.value = "";
  } else {
    console.error("WebSocket is not open or input is empty.");
  }
}

// Fetch users every 5 seconds
setInterval(fetchActiveUsers, 5000);
fetchActiveUsers();
