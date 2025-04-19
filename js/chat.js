// Global WebSocket connection
let socket = null;
let onlineUsers = [];
let unreadMessages = {};
let lastMessageTime = {};
let numberOfMessages = 10;
let previousScrollPosition = 0;
let isLoadingMoreMessages = false;
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
    if (!userList) {
        console.error("Error: 'users-list' element not found.");
        return; // Exit the function if the element doesn't exist
    }
    const displayedUsers = new Set(); // Track displayed users
    userList.innerHTML = ""; // Clear old users

    const usersWithTime = users.map(user => {
        const username = user.username || user;
        return {
            username,
            lastTime: lastMessageTime[username] || 0  // Default to 0 if no messages yet
        };
    });

    usersWithTime.sort((a, b) => b.lastTime - a.lastTime);

    usersWithTime.forEach(({ username }) => {
        // const username = user.username || user; // Handle both object and string cases
        if (!displayedUsers.has(username)) {
            displayedUsers.add(username); // Add username to the set

            const li = document.createElement("li");

            // Check if user is online
            const isOnline = onlineUsers.includes(username);

            // Create status indicator
            const statusIndicator = document.createElement("span");
            statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
            li.appendChild(statusIndicator);

            // Add username text
            li.appendChild(document.createTextNode(username));

            // Add notification indicator if there are unread messages
            if (unreadMessages[username]) {
                const notificationDot = document.createElement("span");
                notificationDot.className = "notification-dot";
                li.appendChild(notificationDot);
            }

            li.style.cursor = "pointer";
            li.onclick = () => openChat(username);

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
            if (data.messages && data.messages.length > 0) {
                // Assuming messages are sorted with newest last
                const lastMsg = data.messages[data.messages.length - 1];
                if (lastMsg.sender === data.from || lastMsg.sender === data.to) {
                    lastMessageTime[data.from] = new Date().getTime();
                }
            }
        } else if (data.type === "allUsers") {
            ShowUsers(data.usernames);
        } else if (data.type === "update") {
            onlineUsers = data.usernames || [];
            fetchAllUsers();

        } else if (data.from && data.message) {
            // Handle direct message from another user
            displayMessage(data.from, data.message);

            lastMessageTime[data.from] = new Date().getTime();

            const curretChatUser = document.querySelector('.chat-header h3')?.textContent;
            if (curretChatUser !== data.from) {
                unreadMessages[data.from] = true;
                fetchAllUsers();
            }
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

    // Save the current scroll height and position before making changes
    const oldScrollHeight = chatMessages.scrollHeight;
    
    // If we're loading more messages, save the current first message to use as an anchor
    let firstVisibleMessage = null;
    if (isLoadingMoreMessages && chatMessages.children.length > 0) {
        firstVisibleMessage = chatMessages.children[0];
    }
    
    // Clear the chat window
    chatMessages.innerHTML = '';

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
            const timestamp = new Date(msg.created_at).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
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

    // Handle scrolling after new messages are loaded
    setTimeout(() => {
        const newScrollHeight = chatMessages.scrollHeight;
        
        if (isLoadingMoreMessages) {
            // Calculate how much new content was added at the top
            const heightDifference = newScrollHeight - oldScrollHeight;
            
            // Set the scroll position to show the same messages as before
            chatMessages.scrollTop = heightDifference + 10; // +10 to offset a bit
            
            // Reset the loading flag
            isLoadingMoreMessages = false;
        } else {
            // For initial load or refresh, scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 0);
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
        <strong>${sender}</strong>${message}
        <span class="timestamp">${new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
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
    numberOfMessages = 10;
    unreadMessages[username] = false;
    const userElements = document.querySelectorAll('#users-list li');
    for (const li of userElements) {
        if (li.textContent.includes(username)) {
            // Find and remove notification dot if it exists
            const dot = li.querySelector('.notification-dot');
            if (dot) {
                dot.remove();
            }
            break;
        }
    }

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
    const chatMessages = document.getElementById("chat-messages");
    let isThrottled = false;
    
    chatMessages.addEventListener('scroll', () => {
        if (chatMessages.scrollTop <= 5 && !isThrottled) {
            isThrottled = true;
            
            // Set the flag that we're loading more messages
            isLoadingMoreMessages = true;
            
            // Increase the number of messages to fetch
            numberOfMessages += 10;
            
            // Request more messages
            requestMessageHistory(username);
            
            // Throttle to prevent multiple rapid requests
            setTimeout(() => {
                isThrottled = false;
            }, 1000);
        }
    });
    
    //chatMessages.scrollTop = previousScrollPosition;
}


function createChatWindow() {
    const chatWindow = document.createElement("div");
    chatWindow.id = "chat-window";
    chatWindow.className = "chat-window";
    chatWindow.style.position = "fixed";
    chatWindow.style.top = "69%";
    chatWindow.style.left = "69%";
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

    const recipientUsername = document.querySelector('.chat-header h3')?.textContent;
    if (recipientUsername) {
        lastMessageTime[recipientUsername] = new Date().getTime();
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
    console.log("toft is not god")
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
        to: otherUser,
        numberOfMessages: numberOfMessages
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