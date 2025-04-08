document.addEventListener("DOMContentLoaded", function () {
  handleRoute();
  isLoggedIn();
  window.addEventListener("hashchange", handleRoute);
});
let socket = null;

function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) return;

  socket = new WebSocket("ws://" + window.location.host + "/api/ws");

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    console.log("WebSocket message:", event.data);
    // handle message here
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function fetchAllUsers() {
  const userList = document.getElementById("users-list");
  

  fetch("/api/all-users")
    .then((response) => response.json())
    .then((users) => {
      const displayedUsers = new Set(); // Track displayed users
      userList.innerHTML = ""; // Clear old users

      users.forEach((user) => {
        const username = user.username || user; // Handle both object and string cases
        if (!displayedUsers.has(username)) {
          displayedUsers.add(username); // Add username to the set

          const li = document.createElement("li");
          li.textContent = username;
          li.style.cursor = "pointer";
          li.onclick = () => openChat(username); // Pass the correct username

          userList.appendChild(li);
        }
      });
    })
    .catch((error) => console.error("Error fetching all users:", error));
}

function handleRoute() {
  const route = window.location.pathname;
  console.log("Current route:", route); // Debug log
  const container = document.getElementById("content");

  container.innerHTML = "";

  isLoggedIn().then((loggedIn) => {
    const publicRoutes = ["/login", "/signup"];
    if (!loggedIn && !publicRoutes.includes(route)) {
      history.pushState({}, "", "/login");
      loadLoginPage();
      return;
    }

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
        loadLoginPage();
        break;
      case "/signup":
        loadSignupPage();
        break;
      case "/home":
        if (loggedIn) {
          loadHomePage();
        } else {
          history.pushState({}, "", "/login");
          loadLoginPage();
        }
        break;
      default:
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
  isLoggedIn().then((loggedIn) => {
    if (!loggedIn) {
      console.error("Unauthorized access to home page");
      history.pushState({}, "", "/login");
      loadLoginPage();
      return;
    }

    connectWebSocket();

    const container = document.getElementById("content");
    container.innerHTML = `
      <h1>Home</h1>
      <div><button id="create-post-btn">Create Post</button></div>
    `;

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.innerHTML = `
      <section class="active-users">
          <h3>Users</h3>
          <ul id="users-list" class="user-list">
              <!-- Active users will be dynamically inserted here -->
          </ul>
      </section>
  `;
      fetchAllUsers();
    } else {
      console.error("Sidebar element not found");
    }
    // Create post popup logic
    const createPostBtn = document.getElementById("create-post-btn");
    const createPostPopup = document.getElementById("create-post-popup");

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
        // Handle form submission here
      });
    };

    createPostBtn.addEventListener("click", () => {
      if (createPostPopup.innerHTML.trim() === "") {
        createPopupContent();
      }
      createPostPopup.classList.remove("hidden");
    });

    fetch("/api/posts")
      .then((response) => response.json())
      .then((posts) => {
        insertPosts(posts);
      })
      .catch((error) => {
        console.error("Error loading posts:", error);
        const container = document.getElementById("posts-container");
        container.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
      });
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

