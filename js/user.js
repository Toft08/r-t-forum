document.addEventListener("DOMContentLoaded", () => {
  console.log("user.js loaded!");

  let socket = null;

  // Function to update active users list
  function updateActiveUsersList(users) {
    console.log("Updating active users list:", users);

    const userList = document.getElementById("active-users-list");
    if (!userList) {
      console.error("Error: active-users-list element not found!");
      return;
    }
    userList.innerHTML = ""; // Clear old users

    users.forEach((user) => {
      const li = document.createElement("li");
      li.textContent = user;
      li.addEventListener("click", () => openChatWindow(user));
      userList.appendChild(li);
    });
  }
  async function fetchActiveUsers() {
    try {
      const response = await fetch('/api/active-users');
      if (response.ok) {
        const users = await response.json();
        updateActiveUsersList(users);  // Update the active user list in the UI
      } else {
        console.error("Error fetching active users:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching active users:", error);
    }
  }

  // Function to open or create a private chat window
  function openChatWindow(toUser, keepMinimized = false) {
    let chatWindow = document.getElementById(`chat-${toUser}`);

    if (!chatWindow) {
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

      chatWindow.querySelector(".close-btn").addEventListener("click", () => closeChatWindow(toUser));
      chatWindow.querySelector(`#input-${toUser}`).addEventListener("keydown", (event) => {
        if (event.key === "Enter") sendMessage(toUser);
      });
      chatWindow.querySelector(".send-btn").addEventListener("click", () => sendMessage(toUser));
    }

    if (!keepMinimized) {
      chatWindow.style.display = "block";
      setTimeout(() => document.getElementById(`input-${toUser}`).focus(), 100);
    }

    return chatWindow;
  }

  function closeChatWindow(username) {
    let chatWindow = document.getElementById(`chat-${username}`);
    if (chatWindow) chatWindow.style.display = "none";
  }

  function sendMessage(toUser) {
    let input = document.getElementById(`input-${toUser}`);
    let message = input.value.trim();

    if (message && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "private-message", to: toUser, message: message }));

      const messagesContainer = document.getElementById(`messages-${toUser}`);
      if (messagesContainer) {
        const newMessage = document.createElement("div");
        newMessage.classList.add("message", "sent");
        newMessage.textContent = `You: ${message}`;
        messagesContainer.appendChild(newMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      input.value = "";
      input.focus();
    } else {
      console.error("WebSocket is not open. Message not sent.");
      alert("Connection lost. Please refresh the page.");
    }
  }

  function displayPrivateMessage(from, content) {
    openChatWindow(from, true);
    const messagesContainer = document.getElementById(`messages-${from}`);
    if (messagesContainer) {
      const newMessage = document.createElement("div");
      newMessage.classList.add("message", "received");
      newMessage.textContent = `${from}: ${content}`;
      messagesContainer.appendChild(newMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  fetchActiveUsers();
  window.openChatWindow = openChatWindow;
  window.closeChatWindow = closeChatWindow;
  window.sendMessage = sendMessage;
  window.updateActiveUsersList = updateActiveUsersList;
  window.displayPrivateMessage = displayPrivateMessage;
});
