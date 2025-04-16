
document.addEventListener("DOMContentLoaded", function () {
  handleRoute();
  isLoggedIn();
  window.addEventListener("hashchange", handleRoute);
});

function fetchAllUsers() {
  fetch("/api/all-users")
    .then((response) => response.json())
    .then((res) => {
      if (res.ok) {
        console.log("All users fetched successfully");
      }
    })
    .catch((error) => console.error("Error fetching all users:", error));
}



function handleRoute() {
  const route = window.location.pathname;
  console.log("Current route:", route); // Debug log
  const container = document.getElementById("content");
  const navbar = document.getElementById("navbar");
  const loginview = document.getElementById("loginview");
  const signupview = document.getElementById("signupview");
  const postview = document.getElementById("postview");
  if (navbar) {
    if (route === "/login" || route === "/signup") {
      navbar.style.display = "none"; // Hide the navbar
    }
    else {
      navbar.style.display = "block"; // Show the navbar
    }
  }

  if (loginview) {
    if (route === "/login") {
      loginview.style.display = "flex";
    } else {
      loginview.style.display = "none";
      loginview.innerHTML = ""; // optional: clear
    }
  }

  // Hide or clear signupview unless on /signup
  if (signupview) {
    if (route === "/signup") {
      signupview.style.display = "flex";
    } else {
      signupview.style.display = "none";
      signupview.innerHTML = ""; // optional: clear
    }
  }
  if (postview) {
    if (route === "/home") {
      postview.style.display = "flex";
    } else {
      postview.style.dispaly = "none";
      postview.innerHTML = "";
    }
  }

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
  console.log("Updating username display:", username); // Debug log
  const welcomeText = document.getElementById("username-placeholder");
  if (welcomeText) {
    welcomeText.textContent = username || "Guest";
    window.currentUsername = username || "Guest"; // Store the current username globally
  }
}
async function isLoggedIn() {
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
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.innerHTML = `
      <nav class="nav">
        <div class="nav-left">
            <a href="/"><span class="material-symbols-outlined" style="font-size: 40px">home</span></a>
        </div>
        <div class="nav-right">
            <p class="welcome-text">Logged in as: <span id="username-placeholder">${window.currentUsername || "Guest"}</span></p>
            <button type="submit" id="logout-button">Log Out</button>
        </div>
    </nav>
    `;
  }
  isLoggedIn().then((loggedIn) => {
    if (!loggedIn) {
      console.error("Unauthorized access to home page");
      history.pushState({}, "", "/login");
      loadLoginPage();
      return;
    }
    window.currentUsername = window.currentUsername
    connectWebSocket();


    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
      logoutButton.addEventListener('click', function () {
        console.log('Logging out...');
        logout();
      });
    } else {
      console.error('Logout button not found');
    }

    const container = document.getElementById("postview");
    container.innerHTML = `
    <div> <button id="create-post-btn">Create Post</button></div>
    <div id="create-post-popup"></div>
    `;

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.innerHTML = `
      <section class="active-users">
          <h3>Users</h3>
          <ul id="users-list" class="user-list">
          </ul>
      </section>
  `;
      fetchAllUsers();
    } else {
      console.error("Sidebar element not found");
    }



    loadPosts();
    initializeCreatePostFeature();
  });
}

function loadPosts() {
  fetch("/api/posts")
    .then((response) => response.json())
    .then((posts) => insertPosts(posts))
    .catch((error) => {
      console.error("Error loading posts:", error);
      document.getElementById("posts-container").innerHTML =
        `<p>Error loading posts: ${error.message}</p>`;
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
    let categoriesArray = [];
    if (post.categories) {
      if (Array.isArray(post.categories)) {
        categoriesArray = post.categories;
      }
      else if (typeof post.categories === "string") {
        categoriesArray = post.categories.split(",");
      }
    }
    const uniqueCategories = [...new Set(categoriesArray)];
    const categoriesText = uniqueCategories.length > 0 ? uniqueCategories.join(", ") : "No categories";

    const postElement = document.createElement("div");
    postElement.className = "post-card";
    postElement.dataset.postId = post.post_id;
    postElement.innerHTML = `
          <div class="post-header">
              <span>Posted by: ${post.username}</span>
              <span>${formatDate(post.created_at)}</span>
          </div>
          <h3 class="post-title">${post.post_title}</h3>
          <div class="post-content">${post.post_content.substring(0, 50)}</div>
          <div class="post-footer">
              <div class="categories">Categories: ${categoriesText}</div>
              <div class="post-stats">
                  <div class="comments">
                      <span class="material-symbols-outlined">comment</span> ${(post.comments ?? []).length}</div>
                  <div class="likes">
                      <span class="material-symbols-outlined">thumb_up</span> ${post.likes}</div>
                  <div class="dislikes">
                      <span class="material-symbols-outlined">thumb_down</span> ${post.dislikes}</div>
              </div>
          </div>
      `;

    // const createPostModal = document.getElementById("create-post-modal");
    // Add event listener for post click
    postElement.addEventListener("click", () => {
      console.log("in insertPosts: Post clicked:", post.post_id);
      initializePostModal(post.post_id);
    });

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

