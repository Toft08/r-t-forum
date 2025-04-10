// Global WebSocket connection
let socket = null;

// Add WebSocket connection function
function connectWebSocket() {
    // Only create a new connection if one doesn't exist
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected");
        return socket;
    }

    console.log("Creating new WebSocket connection");
    socket = new WebSocket("ws://" + window.location.host + "/api/ws");

    socket.onopen = () => {
        console.log("WebSocket connected successfully");
    };

    socket.onmessage = handleWebSocketMessage;

    socket.onclose = () => {
        console.log("WebSocket connection closed");
        socket = null; // Reset socket variable when connection closes
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    return socket;
}
function ShowUsers(users) {
    const userList = document.getElementById("users-list");
    const displayedUsers = new Set(); // Track displayed users
        userList.innerHTML = ""; // Clear old users
  
        users.forEach((user) => {
          const username = user.username || user; // Handle both object and string cases
          if (!displayedUsers.has(username)) {
            displayedUsers.add(username); // Add username to the set
  
            const li = document.createElement("li");
            li.textContent = username;
            li.style.cursor = "pointer";
            li.onclick = () => openChat(username); // Pass the correct username
  
            userList.appendChild(li);
          }
        });
  }
// Add message handling functions
function handleWebSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        if (data.type === "messages") {
            // Handle message history
            displayMessageHistory(data.messages);
        } else if (data.type === "allUsers"){
            ShowUsers(data.usernames);

        }else if (data.type === "update"){
            fetchAllUsers();

        }else if (data.from && data.message) {
            // Handle direct message from another user
            displayMessage(data.from, data.message);
        } else if (data.type === "error") {
            console.error("Error from WebSocket:", data.message);
        }
    } catch (error) {
        console.error("Error parsing WebSocket message:", error);
    }
}

function displayMessageHistory(messages) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    chatMessages.innerHTML = ''; // Clear the current chat window

    if (Array.isArray(messages) && messages.length > 0) {
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.textContent = `${msg.sender}: ${msg.content} (${msg.created_at})`;
            chatMessages.prepend(messageElement);
        });
    } else {
        chatMessages.innerHTML = '<p>No messages found.</p>';
    }

    // Auto-scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayMessage(sender, message) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    chatMessages.appendChild(messageElement);

    // Auto-scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.addEventListener("DOMContentLoaded", async () => {
    const activeUsersPopup = document.querySelector('.active-users');
    const minimizeButton = document.getElementById('minimize-users');
    const usernamePlaceholder = document.getElementById('username-placeholder');
    const username = await fetchCurrentUsername();

    if (usernamePlaceholder) {
        usernamePlaceholder.textContent = username; // Update the placeholder
    }
    console.log("Current username is:", username);
    window.currentUsername = username; // Set globally for use in other functions

    // Make functions globally accessible
    window.openChat = openChat;
    window.closeChat = closeChat;
    window.sendMessage = sendMessage;
    window.connectWebSocket = connectWebSocket;

    // Connect to WebSocket when page loads
    connectWebSocket();
});

function openChat(username) {
    // Create/update chat window UI
    const chatWindow = document.getElementById("chat-window") || createChatWindow();

    chatWindow.style.display = "block";
    chatWindow.innerHTML = `
      <div class="chat-header">
        <h3>Chat with ${username}</h3>
        <button onclick="closeChat()">×</button>
      </div>
      <div id="chat-messages" class="chat-messages"></div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message...">
        <button onclick="sendMessage('${username}')">Send</button>
      </div>
    `;

    // Store who we're chatting with
    window.currentChatPartner = username;

    // Connect to WebSocket if needed
    connectWebSocket();

    // Request message history
    requestMessageHistory(username);

    // Set up Enter key for sending
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage(username);
        }
    });
}

function createChatWindow() {
    const chatWindow = document.createElement("div");
    chatWindow.id = "chat-window";
    chatWindow.className = "chat-window";
    chatWindow.style.position = "fixed";
    chatWindow.style.bottom = "20px";
    chatWindow.style.right = "20px";
    chatWindow.style.width = "300px";
    chatWindow.style.backgroundColor = "#fff";
    chatWindow.style.border = "1px solid #ccc";
    chatWindow.style.borderRadius = "5px";
    chatWindow.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
    chatWindow.style.zIndex = "1000";
    document.body.appendChild(chatWindow);
    return chatWindow;
}

function closeChat() {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
        chatWindow.style.display = "none";
    }
    window.currentChatPartner = null;
}

function sendMessage(recipient) {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();

    if (!message) return; // Don't send empty messages

    // Make sure we're connected
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        socket = connectWebSocket();
        // Wait for connection to establish
        socket.addEventListener("open", () => {
            sendActualMessage(recipient, message);
        }, { once: true }); // Use once: true to prevent multiple handlers
    } else {
        // Connection already exists, send immediately
        sendActualMessage(recipient, message);
    }

    // Clear the input field
    input.value = "";
}

function sendActualMessage(recipient, message) {

    console.log(`Sending message to ${recipient}: ${message}`);
    // Create the message object
    const messageObj = {
        from: window.currentUsername, // Add sender information
        to: recipient,
        message: message
    };

    // Send the message
    socket.send(JSON.stringify(messageObj));

    // // Also display in our own chat (for immediate feedback)
    // displayMessage(window.currentUsername, message);
}

function requestMessageHistory(otherUser) {
    // Make sure we're connected
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        socket = connectWebSocket();
        // Wait for connection to establish
        socket.addEventListener("open", () => {
            sendHistoryRequest(otherUser);
        }, { once: true });
    } else {
        // Connection already exists, send immediately
        sendHistoryRequest(otherUser);
    }
}

function sendHistoryRequest(otherUser) {
    // Create history request object
    console.log("current user name", window.currentUsername)
    const requestObj = {
        type: "fetchMessages",
        from: window.currentUsername, // Add sender info
        to: otherUser
    };

    // Send the request
    socket.send(JSON.stringify(requestObj));
}

async function fetchCurrentUsername() {
    try {
        const response = await fetch('/api/check-session', {
            method: 'GET',
            credentials: 'include', // Include cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.username; // Return the logged-in username
        } else {
            console.error("User is not logged in.");
            return "Guest"; // Default to "Guest" if not logged in
        }
    } catch (error) {
        console.error("Error fetching current username:", error);
        return "Guest"; // Default to "Guest" on error
    }
}