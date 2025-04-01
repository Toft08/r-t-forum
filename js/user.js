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

    // Handle different message types (e.g., private message, notification)
    if (message.type === "private-message") {
      displayPrivateMessage(message.from, message.content);
    }
  };

  // When the WebSocket connection is closed
  socket.onclose = function () {
    console.log("WebSocket connection closed.");
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
          const li = document.createElement("li");
          li.textContent = user;
          li.addEventListener("click", () => openChatWindow(user)); // Open chat on click
          userList.appendChild(li);
        });
        activeUsersFetched = true;
      })
      .catch((error) => console.error("Error fetching active users:", error));
  }
  const activeUsersButton = document.getElementById("fetch-active-users-button");
  if (activeUsersButton) {
    activeUsersButton.addEventListener("click", fetchActiveUsers);
  }

  // Function to open a private chat window
  function openChatWindow(username) {
    let chatWindow = document.getElementById(`chat-${username}`);

    if (!chatWindow) {
      chatWindow = document.createElement("div");
      chatWindow.id = `chat-${username}`;
      chatWindow.classList.add("chat-popup");
      chatWindow.innerHTML = `
          <div class="chat-header">
              <span>Chat with ${username}</span>
              <button onclick="closeChatWindow('${username}')">X</button>
          </div>
          <div class="chat-messages" id="messages-${username}"></div>
          <input type="text" id="input-${username}" placeholder="Type a message..." onkeydown="sendMessage(event, '${username}')">
        `;
      document.body.appendChild(chatWindow);
    }

    chatWindow.style.display = "block";
  }

  // Function to close the chat window
  function closeChatWindow(username) {
    let chatWindow = document.getElementById(`chat-${username}`);
    if (chatWindow) {
      chatWindow.style.display = "none";
    }
  }

  // Function to send private messages
  function sendMessage(event, username) {
    if (event.key === "Enter") {
      let input = document.getElementById(`input-${username}`);
      let message = input.value.trim();
      if (message) {
        // Check if WebSocket is open before sending a message
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "private-message",
              to: username,
              message: message,
            })
          );
          input.value = ""; // Clear input field
        } else {
          console.error("WebSocket is not open. Message not sent.");
        }
      }
    }
  }

  // Function to display received private messages
  function displayPrivateMessage(from, content) {
    const messagesContainer = document.getElementById(`messages-${from}`);
    if (messagesContainer) {
      const newMessage = document.createElement("div");
      newMessage.classList.add("message");
      newMessage.textContent = `${from}: ${content}`;
      messagesContainer.appendChild(newMessage);
    }
  }


  // Expose necessary functions globally for access in the HTML
  window.openChatWindow = openChatWindow;
  window.closeChatWindow = closeChatWindow;
  window.sendMessage = sendMessage;
});
