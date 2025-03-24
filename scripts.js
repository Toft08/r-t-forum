document.addEventListener('DOMContentLoaded', function () {
    fetch("/posts")
        .then((response) => response.json())
        .then((data) => insertPosts(data))
        .catch((error) => console.error("Error loading posts:", error));
});

function insertPosts(posts) {
    const container = document.getElementById('posts-container');
    container.innerHTML = ''; // Clear container first

    if (posts.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }

    posts.forEach((post) => {
        // Format the categories as a comma-separated list
        const categoriesArray = post.categories ? post.categories.split(',') : [];
        const categoriesText = categoriesArray.length > 0
            ? categoriesArray.join(', ')
            : 'No categories';

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
    // Convert SQL datetime to a more friendly format
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // If date parsing fails, try to handle SQLite format
        // SQLite datetime format: YYYY-MM-DD HH:MM:SS
        const parts = dateString.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
        if (parts) {
            const year = parseInt(parts[1]);
            const month = parseInt(parts[2]) - 1; // JS months are 0-based
            const day = parseInt(parts[3]);
            const hour = parseInt(parts[4]);
            const minute = parseInt(parts[5]);
            const second = parseInt(parts[6]);

            const formattedDate = new Date(year, month, day, hour, minute, second);
            return formattedDate.toLocaleString();
        }
        return dateString; // Return as-is if parsing fails
    }

    return date.toLocaleString();
}