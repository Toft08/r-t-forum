function initializeCreatePostFeature() {
    const createPostBtn = document.getElementById("create-post-btn");
    const createPostPopup = document.getElementById("create-post-popup");

    createPostPopup.classList.add("hidden");

    // Show popup when clicking Create Post
    createPostBtn.addEventListener("click", () => {
        createPopupContent();
        createPostPopup.classList.remove("hidden");
    });
}

async function createPopupContent() {
    const createPostPopup = document.getElementById("create-post-popup");

    fetch("/api/create-post")
        .then((res) => res.json())
        .then((categories) => {
        createPostPopup.innerHTML = `
        <h2>Create a new post</h2>
        <form id="create-form">
            <input type="text" id="title" name="title" placeholder="Title" required maxlength="50"><br>
            <textarea class="content-textarea" id="post-content" name="post-content" placeholder="Write your post here!" required></textarea><br>
            <label="categories">Select Topics:</label>
            <div class="category-container">
                ${categories
                    .filter(cat => cat.CategoryID !== 1)
                    .map(cat => `
                    <label class="category-tags">
                        <input type="checkbox" class="category-checkbox" name="categories" value="${cat.CategoryID}">
                        ${cat.CategoryName}
                    </label>
                `).join('')}
            </div><br>
            <button type="submit">Post!</button>
        </form>
        <button id="close-popup-btn" class="close-button">Close</button>
        `;

        // Event: Close popup
        document.getElementById("close-popup-btn").addEventListener("click", () => {
            createPostPopup.classList.add("hidden");
        });

        // Event: Submit form
        document.getElementById("create-form").addEventListener("submit", handlePostSubmit);
        })
        .catch((error) => {
            console.error("Failed to submit post:", error);
            createPostPopup.innerHTML = "<p>Error loading categories</p>";
        });
}

async function handlePostSubmit(event) {
    event.preventDefault();
    const title = document.getElementById("title").value.replace(/[<>]/g, '').trim();
    const content = document.getElementById("post-content").value.replace(/[<>]/g, '').trim();
    const selectedCategories = [...document.querySelectorAll("input[name='categories']:checked")]
        .map(cb => cb.value);

    // debugging check
    console.log("Title:", title);
    console.log("Content:", content);
    console.log("Selected categories:", selectedCategories);

    // Check if title and content are not empty
    if (!title || !content) {
        alert("Please fill in all fields.");
        console.log("Title or content is empty.");
        return;
    }

    const response = await fetch("/api/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            post_title: title,
            post_content: content,
            categories: selectedCategories }),
    });
    const result = await response.json();
        if (response.ok) {
            console.log("Post created successfully!");
            document.getElementById("create-post-popup").classList.add("hidden");
            loadPosts(); // Reload posts dynamically
        } else {
            console.error("Error creating post:", result.error);
        }
}
