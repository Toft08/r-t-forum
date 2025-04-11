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
        messages.sort((a, b) => {
            if (a.created_at === b.created_at) {
                return a.id - b.id;
            }
            return new Date(a.created_at) - new Date(b.created_at);
        });
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            
            // Add appropriate class based on sender
            if (msg.sender === window.currentUsername) {
                messageElement.className = 'sent';
            } else {
                messageElement.className = 'received';
            }
            
            // Format the message with timestamp
            const timestamp = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            messageElement.innerHTML = `
                <strong>${msg.sender}</strong> ${msg.content}
                <span class="timestamp">${timestamp}</span>
            `;
            
            chatMessages.appendChild(messageElement);
        });
    } else {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-chat';
        emptyMessage.innerHTML = '<p>No messages yet. Start the conversation!</p>';
        chatMessages.appendChild(emptyMessage);
    }

    // Auto-scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayMessage(sender, message) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    
    // Add appropriate class based on sender
    if (sender === window.currentUsername) {
        messageElement.className = 'sent new';
    } else {
        messageElement.className = 'received new';
    }
    
    // Format the message with sender name and content
    messageElement.innerHTML = `
        <strong>${sender}</strong>: ${message}
        <span class="timestamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    `;
    
    chatMessages.appendChild(messageElement);

    // Auto-scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Remove the 'new' class after animation completes
    setTimeout(() => {
        messageElement.classList.remove('new');
    }, 300);
}

document.addEventListener("DOMContentLoaded", async () => {
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

    chatWindow.classList.remove("hidden");
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
    chatWindow.style.top = "50%";
    chatWindow.style.left = "50%";
    chatWindow.style.transform = "translate(-50%, -50%)";
    chatWindow.style.width = "300px";
    chatWindow.style.Height = "400px";
    chatWindow.style.maxHeight = "80vh";
    chatWindow.style.overflow = "hidden";
    chatWindow.style.backgroundColor = "#fff";
    chatWindow.style.border = "1px solid #ccc";
    chatWindow.style.borderRadius = "16px";
    chatWindow.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
    chatWindow.style.zIndex = "1000";
    document.body.appendChild(chatWindow);
    return chatWindow;
}

function closeChat() {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
        chatWindow.style.display = "none";
        chatWindow.classList.add("hidden");
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