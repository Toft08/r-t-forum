/**
 * Initializes a modal dialog for displaying a specific post.
 * Creates the modal structure, fetches post details, and sets up event handlers for closing.
 * @param {number|string} post_id - The ID of the post to display in the modal
 */
function initializePostModal(post_id) {
  // Remove any existing modal
  const existingPostModal = document.getElementById("post-modal");
  if (existingPostModal) existingPostModal.remove();

  const postModal = document.createElement("div");
  postModal.id = "post-modal";
  postModal.classList.add("modal");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  // Create close button
  const closeModal = document.createElement("span");
  closeModal.id = "close-modal";
  closeModal.classList.add("close");
  closeModal.innerHTML = "&times;";

  modalContent.appendChild(closeModal);
  postModal.appendChild(modalContent);


  document.body.appendChild(postModal);

  fetchPostDetails(post_id);


  postModal.style.display = "block";

  // Event listener to close the modal
  closeModal.onclick = function () {
    postModal.style.display = "none";
    window.location.reload();
  };

  // Close the modal if the user clicks outside of the modal content
  window.onclick = function (event) {
    if (event.target == postModal) {
      postModal.style.display = "none";
      window.location.reload();
    }
  };
}

/**
 * Fetches detailed information for a specific post from the server API.
 * Handles the API response and passes post data to the rendering function.
 * @param {number|string} post_id - The ID of the post to fetch
 */
function fetchPostDetails(post_id) {
  fetch(`/api/post/${post_id}`)
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

/**
 * Renders the post data inside the modal with all its components.
 * Creates post content, like/dislike buttons, comments section, and sets up event listeners.
 * @param {Object} postData - The post data object containing all post information
 */
function renderPost(postData) {
  const postModal = document.getElementById("post-modal");
  if (!postModal) {
    console.error("Post modal not found");
    return;
  }

  const modalContent = postModal.querySelector(".modal-content");
  if (!modalContent) {
    console.error("Modal content not found");
    return;
  }

  const postDetails = document.createElement("div");
  postDetails.id = "post-details";

  // Clear previous content
  postDetails.innerHTML = '';

  postDetails.innerHTML = `
    <div id="post-container">
      <div class="post-header-like-dislike">
        <h3 class="post-title">${postData.post_title}</h3>
        <div class="reaction-buttons">
          <button id="like-button-${postData.post_id}" class="like-button" style="color: ${postData.liked_now ? "#54956d" : "inherit"}">
            <span class="material-symbols-outlined">thumb_up</span>
          </button>
          <span id="like-count-${postData.post_id}" class="reaction-count">${postData.likes}</span>
          <button id="dislike-button-${postData.post_id}" class="dislike-button" style="color: ${postData.disliked_now ? "rgb(197, 54, 64)" : "inherit"}">
            <span class="material-symbols-outlined">thumb_down</span>
          </button>
          <span id="dislike-count-${postData.post_id}" class="reaction-count">${postData.dislikes}</span>
        </div>
      </div>
      <div class="category-container">
      ${postData.categories.map(cat => `<p class="category-selection">${cat}</p>`).join('')}
      </div>
      <div class="post-info">
        <div class="left">
          <span class="username">${postData.username}</span>
        </div>
        <p class="right">${postData.created_at}</p>
      </div>
      <div class="post-card">
        <p class="post-body">${postData.post_content}</p>
      </div>
    </div>
    <div id="comment-section">
      <h3 class="comment-header">Comments:</h3>
      <form id="comment-form" data-post-id="${postData.post_id}">
        <textarea class="comment-textarea" id="comment" name="comment" placeholder="Enter comment here" required maxlength="200"></textarea>
        <button type="submit">Submit Comment</button>
      </form>
      ${postData.comments && postData.comments.length > 0 ? postData.comments.map((comment) => `
        <div class="comment" id="comment-${comment.comment_id}">
          <p><strong>${comment.username}</strong>: ${comment.created_at}</p>
          <pre>${comment.comment_content}</pre>
        </div>
      `).join("")
      : "<p>No comments yet.</p>"}
    </div>
  `;

  postModal.style.display = 'block';

  modalContent.appendChild(postDetails);

  // Event listener for the comment form submission
  document.getElementById('comment-form').addEventListener('submit', function (event) {
    event.preventDefault();
    handleComment();
  });

  // Event listeners for like and dislike buttons
  document.getElementById(`like-button-${postData.post_id}`).addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent the post click event
    const voteData = {
      vote: 'like',
      post_id: postData.post_id,
      comment_id: 0
    };
    apiPOST(`/api/post/${postData.post_id}/vote`, 'vote', voteData);
  });

  document.getElementById(`dislike-button-${postData.post_id}`).addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent the post click event
    const voteData = {
      vote: 'dislike',
      post_id: postData.post_id,
      comment_id: 0
    };
    apiPOST(`/api/post/${postData.post_id}/vote`, 'vote', voteData);
  });
}

/**
 * Handles the submission of a new comment on a post.
 * Validates comment content and sends it to the server API.
 */
function handleComment() {
  const commentTextarea = document.getElementById('comment');
  if (!commentTextarea) {
    console.error("Comment textarea not found");
    return;
  }
  const commentContent = commentTextarea.value.replace(/[<>]/g, '').trim();
  if (!commentContent) {
    console.warn("Empty comment, ignoring submission");
    return;
  }
  const commentForm = document.getElementById('comment-form');
  if (!commentForm) {
    console.error("Comment form not found");
    return;
  }

  const postID = document.getElementById('comment-form').dataset.postId;
  if (!postID) {
    console.error("Post ID not found in comment form");
    return;
  }

  apiPOST(`/api/post/${postID}/comment`, 'comment', { comment_content: commentContent });
}

/**
 * Makes POST requests to the API for various actions like commenting or voting.
 * Updates UI based on the response type and handles any errors.
 * @param {string} url - The API endpoint URL
 * @param {string} action - The type of action ('vote' or 'comment')
 * @param {Object} postData - The data to send in the request body
 * @returns {Promise<void>}
 */
async function apiPOST(url, action, postData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      throw new Error(data.message || "Unknown error");
    }

    switch (action) {
      case 'vote':
        // Update the UI to reflect the new vote counts
        updateVoteUI(postData.post_id, data.likes, data.dislikes);
        break;

      case 'comment':
        if (data.comment) {
          appendComment(data.comment);
        } else if (data.comments && data.comments.length > 0) {
          // Sometimes API returns an array of comments with the newest first
          const sortedComments = data.comments.sort((a, b) => b.comment_id - a.comment_id);
          appendComment(sortedComments[0]);
        } else {
          console.error("Comment data missing in response:", data);
          throw new Error("Comment data missing in response");
        }
        break;

      default:
        console.warn(`Unhandled action type: ${action}`);
    }
  } catch (error) {
    console.error(`Error in ${action} request:`, error);
    displayError(error.message, action);
  }
}


/**
 * Updates the like and dislike count UI elements after a vote action.
 * @param {number|string} postId - The ID of the post to update
 * @param {number} likes - The updated like count
 * @param {number} dislikes - The updated dislike count
 */
function updateVoteUI(postId, likes, dislikes) {
  const likeCount = document.getElementById(`like-count-${postId}`);
  const dislikeCount = document.getElementById(`dislike-count-${postId}`);
  if (likeCount) likeCount.textContent = likes;
  if (dislikeCount) dislikeCount.textContent = dislikes;
}

/**
 * Adds a new comment to the comment section in the UI.
 * Handles missing data and replaces "No comments" message if present.
 * @param {Object} comment - The comment data to append
 */
function appendComment(comment) {
  if (!comment) {
    console.error("Comment data is missing");
    return;
  }
  const commentSection = document.getElementById('comment-section');
  if (!commentSection) {
    console.error("Comment section not found");
    return;
  }

  // Check if all required properties exist
  if (!comment.comment_id) {
    console.warn("Comment missing comment_id, generating temporary one");
    comment.comment_id = "temp-" + Date.now();
  }

  if (!comment.username) {
    comment.username = "Anonymous";
  }

  if (!comment.created_at) {
    comment.created_at = new Date().toISOString();
  }

  // Find the "No comments yet" message and remove it if it exists
  const noCommentsMsg = commentSection.querySelector('p:last-child');
  if (noCommentsMsg && noCommentsMsg.textContent === 'No comments yet.') {
    noCommentsMsg.remove();
  }

  const newComment = document.createElement('div');
  newComment.className = 'comment';
  newComment.id = `comment-${comment.comment_id}`;

  newComment.innerHTML = `
    <p><strong>${comment.username}</strong>: ${comment.created_at}</p>
    <pre>${comment.comment_content}</pre>
  `;

  const commentForm = commentSection.querySelector('#comment-form');
  if (commentForm) {
    commentForm.insertAdjacentElement('afterend', newComment);

    // Clear the comment textarea
    const commentTextarea = document.getElementById('comment');
    if (commentTextarea) {
      commentTextarea.value = '';
    }
  } else {
    // If comment form not found, append to comment section
    commentSection.appendChild(newComment);
  }
}
/**
 * Displays an error message for a specific action.
 * Creates or updates an error box and removes it after a timeout.
 * @param {string} message - The error message to display
 * @param {string} action - The action that caused the error ('vote' or 'comment')
 */
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