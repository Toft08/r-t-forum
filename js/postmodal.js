function initializePostModal() {
  const showPostModal = document.getElementById('post-modal');
  const postDetails = document.getElementById('post-details');
  const closeModal = document.getElementById('close-modal');

  showPostModal.addEventListener('click', () => {
    renderPost(post);
    postModal.style.display = 'block';
  });
}

async function renderPost(post) {
  const postDetails = document.getElementById('post-details');
  const postModal = document.getElementById('post-modal');
  const closeModal = document.getElementById('close-modal');

  const categoriesHMTL = post.categories ?
    (Array.isArray(post.categories)
      ? post.categories.map(cat => `<p class="category-selection">${cat.trim()}</p>`).join('')
      : typeof post.categories === 'string'
        ? post.categories.split(',').map(cat => `<p class="category-selection">${cat.trim()}</p>`).join('')
        : '')
    : '';

  // Clear previous content
  postDetails.innerHTML = '';

  // Populate with new post content
  postDetails.innerHTML = `
    <div id="post-container">
      <div class="post-header-like-dislike">
        <h3 class="post-title">${post.post_title}</h3>
        <div class="reaction-buttons">
          <button id="like-button-${post.post_id}" class="like-button" style="color: ${post.liked_now ? '#54956d' : 'inherit'}">
            <span class="material-symbols-outlined">thumb_up</span>
          </button>
          <span id="like-count-${post.post_id}" class="reaction-count">${post.likes}</span>
          <button id="dislike-button-${post.post_id}" class="dislike-button" style="color: ${post.disliked_now ? 'rgb(197, 54, 64)' : 'inherit'}">
            <span class="material-symbols-outlined">thumb_down</span>
          </button>
          <span id="dislike-count-${post.post_id}" class="reaction-count">${post.dislikes}</span>
        </div>
      </div>
      <div class="category-container">
        ${categoriesHMTL}
      </div>
      <div class="post-info">
        <div class="left">
          <span class="material-symbols-outlined" style="font-size: 24px;">filter_vintage</span>
          <span class="username">${post.username}</span>
        </div>
        <p class="right">${formatDate(post.created_at)}</p>
      </div>
      <div class="post-card">
        <p class="post-body">${post.post_content}</p>
      </div>
    </div>
    <div id="comment-section">
      <h3 class="comment-header">Comments:</h3>
      <form id="comment-form" data-post-id="${post.post_id}">
        <textarea class="comment-textarea" id="comment" name="comment" placeholder="Enter comment here" required maxlength="200"></textarea>
        <button type="submit">Submit Comment</button>
      </form>
      ${post.comments && post.comments.length > 0 ? post.comments.map(comment => `
        <div class="comment" id="comment-${comment.comment_id}">
          <p><strong>${comment.username}</strong>: ${comment.created_at}</p>
          <pre>${comment.comment_content}</pre>
        </div>
      `).join('') : '<p>No comments yet.</p>'}
    </div>
  `;

  // Display the modal
  postModal.style.display = 'block';

  // Event listener to close the modal
  closeModal.onclick = function () {
    postModal.style.display = 'none';
  };

  // Close the modal if the user clicks outside of the modal content
  window.onclick = function (event) {
    if (event.target == postModal) {
      postModal.style.display = 'none';
    }
  };

  // Event listener for the comment form submission
  document.getElementById('comment-form').addEventListener('submit', function (event) {
    event.preventDefault();
    handleComment();
  });

  // Event listeners for like and dislike buttons
  document.getElementById(`like-button-${post.post_id}`).addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent the post click event
    const voteData = {
      vote: 'like',
      post_id: post.post_id,
      comment_id: 0
    };
    apiPOST(`/api/post/${post.post_id}/vote`, 'vote', voteData);
  });

  document.getElementById(`dislike-button-${post.post_id}`).addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent the post click event
    const voteData = {
      vote: 'dislike',
      post_id: post.post_id,
      comment_id: 0
    };
    apiPOST(`/api/post/${post.post_id}/vote`, 'vote', voteData);
  });
}

function handleComment() {
  const commentTextarea = document.getElementById('comment');
  const commentContent = commentTextarea.value.replace(/[<>]/g, '').trim();
  const postID = document.getElementById('comment-form').dataset.postId;

  if (!commentContent) {
    return;
  }
  apiPOST(`/api/post/${postID}/comment`, 'post', { comment_content: commentContent });
}

async function apiPOST(url, action, postData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unknown error");
    }

    switch (action) {
      case 'vote':
        // Update the UI to reflect the new vote counts
        updateVoteUI(postData.post_id, data.likes, data.dislikes);
        break;

      case 'comment':
        // Append the new comment to the comment section
        appendComment(postData.post_id, data.comment);
        break;

      default:
        console.warn(`Unhandled action type: ${action}`);
    }
  } catch (error) {
    displayError(error.message, action);
  }
}

function updateVoteUI(postId, likes, dislikes) {
  const likeCount = document.getElementById(`like-count-${postId}`);
  const dislikeCount = document.getElementById(`dislike-count-${postId}`);
  if (likeCount) likeCount.textContent = likes;
  if (dislikeCount) dislikeCount.textContent = dislikes;
}

function appendComment() {
  const commentSection = document.getElementById('comment-section');
  if (commentSection) {
    // Find the "No comments yet" message and remove it if it exists
    const noCommentsMsg = commentSection.querySelector('p:last-child');
    if (noCommentsMsg && noCommentsMsg.textContent === 'No comments yet.') {
      noCommentsMsg.remove();
    }

    const newComment = document.createElement('div');
    newComment.className = 'comment';
    newComment.id = `comment-${comment.comment_id}`;
    newComment.innerHTML = `
      <p><strong>${comment.username}</strong>: ${formatDate(comment.created_at)}</p>
      <pre>${comment.comment_content}</pre>
    `;
    const commentForm = commentSection.querySelector('#comment-form');
    commentForm.insertAdjacentElement('afterend', newComment);
  }
}

function displayError(message, action) {
  let errorBoxId;
  switch (action) {
    case 'vote':
      errorBoxId = document.getElementById('vote-error');
      break;
    case 'comment':
      errorBoxId = document.getElementById('comment-error');
      break;
    default:
      console.error(message);
      return;
  }
  // Check if error box exists, if not create it
  let errorBox = document.getElementById(errorBoxId);
  if (!errorBox) {
    errorBox = document.createElement('div');
    errorBox.id = errorBoxId;
    errorBox.className = 'error-message';

    // Append to appropriate container based on action
    if (action === 'comment') {
      document.getElementById('comment-form').appendChild(errorBox);
    } else {
      document.getElementById('post-details').appendChild(errorBox);
    }
  }
  errorBox.textContent = message;
  errorBox.style.display = 'block';

  setTimeout(() => {
    errorBox.style.display = 'none';
  }, 3000);
}

// This is needed in both files, so we duplicate it to avoid dependencies
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