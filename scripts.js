
document.addEventListener('DOMContentLoaded', function () {
    handleRoute(); // Load the correct page on initial load
    window.addEventListener('hashchange', handleRoute); // Listen for hash changes

    fetch("/posts")
        .then((response) => response.json())
        .then((data) => insertPosts(data))
        .catch((error) => console.error("Error loading posts:", error));

    // Create post popup window.
    const createPostBtn = document.getElementById('create-post-btn');
    const createPostPopup = document.getElementById('create-post-popup');

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

        const closePopupBtn = document.getElementById('close-popup-btn');
        const createForm = createPostPopup.querySelector('#create-form');

        closePopupBtn.addEventListener('click', () => {
            createPostPopup.classList.add('hidden');
        });

        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createPostPopup.classList.add('hidden');
        });
    };

    // Show popup when create post button is clicked
    createPostBtn.addEventListener('click', () => {
        // Create popup content if not already created
        if (createPostPopup.innerHTML.trim() === '') {
            createPopupContent();
        }

        // Show popup
        createPostPopup.classList.remove('hidden');
    });
});

function handleRoute() {
    const route = window.location.pathname; // Get the hash part (without #)
    const container = document.getElementById('content'); // Main content container

    // Check if we are in the signup or login route, otherwise load homepage content
    switch (route) {
        case '/signup':
            loadSignupPage(); // Load the signup page
            break;
        case '/login':
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
        console.log("Sign Up button clicked!");
        // history.pushState({}, '', '/signup'); // Change the URL to /signup without the hash
        loadSignupPage(); // Load the signup form dynamically
    });

    container.appendChild(signupButton); // Append the Sign Up button

    // Load posts from the backend
    fetch("/posts")
        .then((response) => response.json())
        .then((data) => insertPosts(data))
        .catch((error) => console.error("Error loading posts:", error));
}


function insertPosts(posts) {
    console.log("Loading posts")
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
