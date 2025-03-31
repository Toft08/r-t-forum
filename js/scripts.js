document.addEventListener("DOMContentLoaded", function () {
  handleRoute(); // Load the correct page on initial load
  window.addEventListener("hashchange", handleRoute); // Listen for hash changes

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
      // You can add form submission logic here
      // For now, we'll just prevent default and hide popup
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
});

function handleRoute() {
  const route = window.location.pathname; // Get the hash part (without #)
  const container = document.getElementById("content");
  container.innerHTML = ""; // Clear the container

  const publicRoutes = ["/login", "/signup"];
  isLoggedIn().then(loggedIn => {
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

function isLoggedIn() {
  // Send an API request to check if the session is valid
  return fetch("/api/check-session")
    .then((response) => response.json())
    .then((data) => {
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
      const container = document.getElementById('posts-container');
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
