document.addEventListener("DOMContentLoaded", () => {
  console.log("user.js loaded!");

  const username = prompt("Enter your username:"); // Temporary for testing
  if (!username) return;

  // Establish WebSocket connection with the server
  const socket = new WebSocket(
    `ws://${window.location.host}/api/ws?username=${username}`
  );

  // When the WebSocket connection is established
  socket.onopen = function () {
    console.log("WebSocket connection established.");
    socket.send(JSON.stringify({ type: "join", username: username }));
  };

  // When a message is received from the server
  socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    console.log("Message from server:", message);

    // Handle different message types
    if (message.type === "private-message") {
      // First make sure the chat window exists, then display the message
      openChatWindow(message.from, true); // true = don't focus/show if minimized
      displayPrivateMessage(message.from, message.content);
    }
  };

  // When the WebSocket connection is closed
  socket.onclose = function () {
    console.log("WebSocket connection closed.");
    // Maybe show a reconnect button or automatically try to reconnect
    alert(
      "Connection to chat server lost. Please refresh the page to reconnect."
    );
  };

  // On WebSocket error
  socket.onerror = function (error) {
    console.error("WebSocket Error:", error);
  };

  let activeUsersFetched = false;

  // Function to fetch active users
  function fetchActiveUsers() {
    if (activeUsersFetched) return;
    console.log("Fetching active users...");
    fetch("/api/active-users")
      .then((response) => response.json())
      .then((users) => {
        console.log("Active users received:", users);

        const userList = document.getElementById("active-users-list");
        if (!userList) {
          console.error("Error: active-users-list element not found!");
          return;
        }
        userList.innerHTML = ""; // Clear old users
        users.forEach((user) => {
          if (user !== username) {
            // Don't show yourself in the list
            const li = document.createElement("li");
            li.textContent = user;
            li.addEventListener("click", () => openChatWindow(user)); // Open chat on click
            userList.appendChild(li);
          }
        });
        activeUsersFetched = true;
      })
      .catch((error) => console.error("Error fetching active users:", error));
  }

  const activeUsersButton = document.getElementById(
    "fetch-active-users-button"
  );
  if (activeUsersButton) {
    activeUsersButton.addEventListener("click", fetchActiveUsers);
  }

  // Function to open or create a private chat window
  function openChatWindow(toUser, keepMinimized = false) {
    let chatWindow = document.getElementById(`chat-${toUser}`);

    if (!chatWindow) {
      // Create the chat window if it doesn't exist
      chatWindow = document.createElement("div");
      chatWindow.id = `chat-${toUser}`;
      chatWindow.classList.add("chat-popup");
      chatWindow.innerHTML = `
            <div class="chat-header">
                <span>Chat with ${toUser}</span>
                <button class="close-btn" data-username="${toUser}">X</button>
            </div>
            <div class="chat-messages" id="messages-${toUser}"></div>
            <div class="chat-input">
                <input type="text" id="input-${toUser}" placeholder="Type a message...">
                <button class="send-btn" data-username="${toUser}">Send</button>
            </div>
          `;
      document.body.appendChild(chatWindow);

      // Add event listeners to the new elements
      const closeBtn = chatWindow.querySelector(".close-btn");
      closeBtn.addEventListener("click", () => closeChatWindow(toUser));

      const input = chatWindow.querySelector(`#input-${toUser}`);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          sendMessage(toUser);
        }
      });

      const sendBtn = chatWindow.querySelector(".send-btn");
      sendBtn.addEventListener("click", () => sendMessage(toUser));
    }

    // Only show the window if keepMinimized is false
    if (!keepMinimized) {
      chatWindow.style.display = "block";
      // Focus the input field
      setTimeout(() => {
        const input = document.getElementById(`input-${toUser}`);
        if (input) input.focus();
      }, 100);
    }

    return chatWindow;
  }

  // Function to close the chat window
  function closeChatWindow(username) {
    let chatWindow = document.getElementById(`chat-${username}`);
    if (chatWindow) {
      chatWindow.style.display = "none";
    }
  }

  // Function to send private messages
  function sendMessage(toUser) {
    let input = document.getElementById(`input-${toUser}`);
    let message = input.value.trim();

    if (message) {
      // Check if WebSocket is open before sending a message
      if (socket.readyState === WebSocket.OPEN) {
        // Send message to server
        socket.send(
          JSON.stringify({
            type: "private-message",
            to: toUser,
            message: message,
          })
        );

        // Also display the message in your own chat window
        const messagesContainer = document.getElementById(`messages-${toUser}`);
        if (messagesContainer) {
          const newMessage = document.createElement("div");
          newMessage.classList.add("message", "sent");
          newMessage.textContent = `You: ${message}`;
          messagesContainer.appendChild(newMessage);
          messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll
        }

        input.value = ""; // Clear input field
        input.focus(); // Keep focus on input
      } else {
        console.error("WebSocket is not open. Message not sent.");
        alert("Connection lost. Please refresh the page to reconnect.");
      }
    }
  }

  // Function to display received private messages
  function displayPrivateMessage(from, content) {
    // Make sure the chat window exists
    const chatWindow = document.getElementById(`chat-${from}`);
    if (!chatWindow) {
      // This shouldn't happen now since we ensure the window exists before calling this function
      openChatWindow(from, true);
    }

    const messagesContainer = document.getElementById(`messages-${from}`);
    if (messagesContainer) {
      const newMessage = document.createElement("div");
      newMessage.classList.add("message", "received");
      newMessage.textContent = `${from}: ${content}`;
      messagesContainer.appendChild(newMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll

      // If the chat window is hidden, show some notification
      if (chatWindow.style.display === "none") {
        // Show the window or add a notification indicator
        chatWindow.style.display = "block";
        // Or alternatively, add a notification badge to the user in the active users list
      }
    }
  }

  // Expose necessary functions globally for access in the HTML
  window.openChatWindow = openChatWindow;
  window.closeChatWindow = closeChatWindow;
  window.sendMessage = sendMessage;

  // Optionally auto-fetch active users on load
  setTimeout(fetchActiveUsers, 1000);
});
