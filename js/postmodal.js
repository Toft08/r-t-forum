// Function to initialize and display the post modal
function initializePostModal(post_id) {
  // Remove any existing modal
  const existingPostModal = document.getElementById("post-modal");
  if (existingPostModal) existingPostModal.remove();

  // Create a new modal element
  const postModal = document.createElement("div");
  postModal.id = "post-modal";
  postModal.classList.add("modal");

  
  // Create modal content container
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  // Create close button
  const closeModal = document.createElement("span");
  closeModal.id = "close-modal";
  closeModal.classList.add("close");
  closeModal.innerHTML = "&times;";

  // Append close button and content container to modal
  modalContent.appendChild(closeModal);
  postModal.appendChild(modalContent);

  // Append modal to the body
  document.body.appendChild(postModal);

  // Fetch post details and render
  fetchPostDetails(post_id);

  // Display the modal
  postModal.style.display = "block";

  // Event listener to close the modal
  closeModal.onclick = function () {
    postModal.style.display = "none";
  };

  // Close the modal if the user clicks outside of the modal content
  window.onclick = function (event) {
    if (event.target == postModal) {
      postModal.style.display = "none";
    }
  };
}

// Function to fetch post details from the server
function fetchPostDetails(post_id) {
  fetch(`/api/post/${post_id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch post details");
      }
      return response.json();
    })
    .then((post) => {
      console.log("Post details:", post);
      renderPost(post);
    })
    .catch((error) => {
      console.error("Error fetching post details:", error);
      alert("Failed to load post details");
    });
}

// Function to render the post content inside the modal
function renderPost(postData) {
  console.log("in renderPost:", postData);

  const post = postData.post;
  if (!post) {
    console.error("Post data is missing");
    return;
  }

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
  // Create post details container
  const postDetails = document.createElement("div");
  postDetails.id = "post-details";

  console.log("Post ID:", post.post_id);
  console.log ("Post title:", post.post_title);
  console.log ("Post content:", post.post_content);
  console.log ("Post categories:", post.categories);
  console.log ("Post date:", post.created_at);
  console.log ("Post username:", post.username);
  console.log ("Post comments:", post.comments);

  // Clear previous content
  postDetails.innerHTML = '';

  // Populate with new post content
  postDetails.innerHTML = `
    <div id="post-container">
      <div class="post-header-like-dislike">
        <h3 class="post-title">${post.post_title}</h3>
        <div class="reaction-buttons">
          <button id="like-button-${post.post_id}" class="like-button" style="color: ${post.liked_now ? "#54956d" : "inherit"}">
            <span class="material-symbols-outlined">thumb_up</span>
          </button>
          <span id="like-count-${post.post_id}" class="reaction-count">${post.likes}</span>
          <button id="dislike-button-${post.post_id}" class="dislike-button" style="color: ${post.disliked_now ? "rgb(197, 54, 64)" : "inherit"}">
            <span class="material-symbols-outlined">thumb_down</span>
          </button>
          <span id="dislike-count-${post.post_id}" class="reaction-count">${post.dislikes}</span>
        </div>
      </div>
      <div class="category-container">
      ${post.categories.map(cat => `<p class="category-selection">${cat}</p>`).join('')}
      </div>
      <div class="post-info">
        <div class="left">
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
      ${post.comments && post.comments.length > 0 ? post.comments.map((comment) => `
        <div class="comment" id="comment-${comment.comment_id}">
          <p><strong>${comment.username}</strong>: ${comment.created_at}</p>
          <pre>${comment.comment_content}</pre>
        </div>
      `).join("")
      : "<p>No comments yet.</p>"}
    </div>
  `;

  // Display the modal
  postModal.style.display = 'block';

  // Close the modal if the user clicks outside of the modal content
  window.onclick = function (event) {
    if (event.target == postModal) {
      postModal.style.display = 'none';
    }
  };
  modalContent.appendChild(postDetails);

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

  console.log(`Submitting comment for post ${postID}:`, commentContent);
  apiPOST(`/api/post/${postID}/comment`, 'comment', { comment_content: commentContent });
}

async function apiPOST(url, action, postData) {
  try {
    console.log(`Sending ${action} request to ${url}:`, postData);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    // Log the raw response for debugging
    const responseText = await response.text();
    console.log(`Raw response from ${url}:`, responseText);

    // Try to parse as JSON
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

    console.log(`Successful ${action} response:`, data);

    switch (action) {
      // case 'vote':
      //   // Update the UI to reflect the new vote counts
      //   updateVoteUI(postData.post_id, data.likes, data.dislikes);
      //   break;

      case 'comment':
        if (data.comment) {
          appendComment(data.comment);
        } else if (data.comments && data.comments.length > 0) {
          // Sometimes API returns an array of comments with the newest first
          appendComment(data.comments[0]);
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

function updateVoteUI(postId, likes, dislikes) {
  const likeCount = document.getElementById(`like-count-${postId}`);
  const dislikeCount = document.getElementById(`dislike-count-${postId}`);
  if (likeCount) likeCount.textContent = likes;
  if (dislikeCount) dislikeCount.textContent = dislikes;
}

function appendComment(comment) {
  console.log("Appending comment:", comment);
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
    <p><strong>${comment.username}</strong>: ${formatDate(comment.created_at)}</p>
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