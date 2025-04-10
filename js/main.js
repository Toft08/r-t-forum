
document.addEventListener("DOMContentLoaded", function () {
  handleRoute();
  isLoggedIn();
  window.addEventListener("hashchange", handleRoute);
});

function fetchAllUsers() {



  fetch("/api/all-users")
    .then((response) => response.json())
    .then((res) => {
      if(res.ok){
        console.log("All users fetched successfully");
      }
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
  isLoggedIn().then((loggedIn) => {
    if (!loggedIn) {
      console.error("Unauthorized access to home page");
      history.pushState({}, "", "/login");
      loadLoginPage();
      return;
    }
    window.currentUsername = window.currentUsername 
    connectWebSocket();

    const container = document.getElementById("content");
    container.innerHTML = `
      <h1>Home</h1>
    <div> <button id="create-post-btn">Create Post</button></div>
    <div id="create-post-popup" class="hidden"></div>
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

    // Create post popup window.
    const createPostBtn = document.getElementById("create-post-btn");
    const createPostPopup = document.getElementById("create-post-popup");

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
          <div class="post-content">${post.post_content}</div>
          <div class="post-footer">
              <div class="categories">Categories: ${categoriesText}</div>
              <div class="post-stats">
                  <div class="likes">
                      <span class="material-symbols-outlined">thumb_up</span> ${post.likes}</div>
                  <div class="dislikes">
                      <span class="material-symbols-outlined">thumb_down</span> ${post.dislikes}</div>
              </div>
          </div>
      `;
      // Add event listener for post click
      postElement.addEventListener("click", () => {
        fetchPostDetails(post.post_id);
      });
    container.appendChild(postElement);
  });
}

function fetchPostDetails(postId) {
  fetch(`/api/posts/${postId}`)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch post details");
    }
    return response.json();
  })
  .then((post) => {
    renderPost(post);
  })
  .catch((error) => {
    console.error("Error fetching post details:", error);
    alert("Failed to load post details");
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

