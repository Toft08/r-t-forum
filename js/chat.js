let socket = null;
let onlineUsers = [];
let unreadMessages = JSON.parse(localStorage.getItem('unreadMessages') || '{}');
let lastMessageTime = JSON.parse(localStorage.getItem('lastMessageTime') || '{}');
let numberOfMessages = 10;
let previousScrollPosition = 0;
let isLoadingMoreMessages = false;
let lastTypingSent = 0;
const TYPING_THROTTLE_MS = 1000;
/**
 *  Creates or reuses a Websocket connection to the server
 * @returns {WebSocket} The active Websocket connection
 */
function connectWebSocket() {
    // Only create a new connection if one doesn't exist
    if (socket && socket.readyState === WebSocket.OPEN) {
        return socket;
    }

    socket = new WebSocket("ws://" + window.location.host + "/api/ws");

    socket.onopen = () => {
        console.log("WebSocket connected successfully");
    };

    socket.onmessage = handleWebSocketMessage;

    socket.onclose = () => {
        socket = null; // Reset socket variable when connection closes
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    return socket;
}

/**
 * Updates and displays the list of users in the sidebar
 * @param {Array} users - Array of user objects or usernames
 */
function ShowUsers(users) {
    const userList = document.getElementById("users-list");
    if (!userList) {
        console.error("Error: 'users-list' element not found.");
        return;
    }
    const displayedUsers = new Set(); // Track displayed users
    userList.innerHTML = "";

    // sort users by last msg time
    const currentUser = window.currentUsername
    const usersWithTime = users.map(user => {
        const username = user.username || user;
        // Only consider messages TO the current user FROM others
        const lastTime = lastMessageTime[`${username}_to_${currentUser}`] || 0;
        
        return {
            username,
            lastTime
        };
    });

    usersWithTime.sort((a, b) => {
        // If user A has messages and user B doesn't, A comes first
        if (a.lastTime > 0 && b.lastTime === 0) {
            return -1;
        }
        // If user B has messages and user A doesn't, B comes first
        if (a.lastTime === 0 && b.lastTime > 0) {
            return 1;
        }
        // If both have messages, sort by most recent first
        if (a.lastTime > 0 && b.lastTime > 0) {
            return b.lastTime - a.lastTime;
        }
        // If neither has messages, sort alphabetically
        return a.username.localeCompare(b.username);
    });

    usersWithTime.forEach(({ username }) => {
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
/**
 * Processes incoming WebSocket messages
 * @param {MessageEvent} event - The WebSocket message event
 */
function handleWebSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "messages":
                // Handle message history
                displayMessageHistory(data.messages);
                if (data.messages && data.messages.length > 0) {
                    // Update last message timestamp
                    const lastMsg = data.messages[data.messages.length - 1];
                    if (lastMsg.sender === data.from || lastMsg.sender === data.to) {
                        updateLastMessageTime(data.from);
                    }
                }
                break;

            case "typing":
                if (data.from) {
                    showTypingIndicator(data.from);
                }
                break;
            case "stop_typing":
                if (data.from) {
                    hideTypingIndicator(data.from);
                }
                break;
            case "allUsers":
                ShowUsers(data.usernames);
                break;

            case "update":
                onlineUsers = data.usernames || [];
                fetchAllUsers();
                break;

            case "error":
                console.error("Error from WebSocket:", data.message);
                break;

            default:
                // Handle direct message from another user
                if (data.from && data.message) {
                    displayMessage(data.from, data.message);
                    // Update with correct format for incoming messages
                    updateLastMessageTime(data.from);
                    
                    // Add unread notification if not currently chatting with sender
                    const currentChatUser = window.currentChatPartner;
                    if (currentChatUser !== data.from) {
                        unreadMessages[data.from] = true;
                        saveUnreadMessages();
                        fetchAllUsers();
                    }
                }
        }
    } catch (error) {
        console.error("Error parsing WebSocket message:", error);
    }
}
/**
 * Displays message history in the chat window
 * @param {Array} messages - Array of message objects
 */
function displayMessageHistory(messages) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    // Save the current scroll height before making changes
    const oldScrollHeight = chatMessages.scrollHeight;

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
            // When loading more history, maintain relative scroll position
            const heightDifference = newScrollHeight - oldScrollHeight;
            chatMessages.scrollTop = heightDifference + 10; // +10 to offset a bit
            isLoadingMoreMessages = false;
        } else {
            // For initial load or refresh, scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 0);
}
/**
 * Displays a new message in the chat window
 * @param {string} sender - Username of the message sender
 * @param {string} message - Content of the message
 */
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
    window.currentUsername = username; // Set globally for use in other functions

    // Make functions globally accessible
    window.openChat = openChat;
    window.closeChat = closeChat;
    window.sendMessage = sendMessage;
    window.connectWebSocket = connectWebSocket;

    // Connect to WebSocket when page loads
    connectWebSocket();
});
function updateLastMessageTime(username, timestamp = new Date().getTime()) {
    const currentUser = window.currentUsername;
    const key = `${username}_to_${currentUser}`;
    
    console.log(`Updating lastMessageTime: ${key} = ${timestamp}`);
    
    // Update the timestamp
    lastMessageTime[key] = timestamp;
    
    // Save to localStorage
    localStorage.setItem('lastMessageTime', JSON.stringify(lastMessageTime));
}

function saveUnreadMessages() {
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
}
/**
 * Sends a typing indicator to another user
 * @param {string} toUser - Username of the recipient
 */
function sendTypingEvent(toUser) {
    const now = Date.now();
    if (now - lastTypingSent > TYPING_THROTTLE_MS) {
        lastTypingSent = now;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "typing",
                from: window.currentUsername,
                to: toUser
            }));
        }
    }
}

/**
 * Shows typing indicator in the chat window
 * @param {string} fromUser - Username of the user who is typing
 */
function showTypingIndicator(fromUser) {
    const indicatorContainer = document.getElementById("typing-indicator");

    if (!indicatorContainer || !window.currentChatPartner) return;

    // Show only if chatting with the typing user
    if (fromUser === window.currentChatPartner) {
        indicatorContainer.innerHTML = `${fromUser} is typing<span class="dots"><span>.</span><span>.</span><span>.</span></span>`;
        indicatorContainer.style.display = "block";

        // Clear old timeout and set new one
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            hideTypingIndicator(fromUser)
        }, 2000);
    }
}
/**
 * Hides the typing indicator if it's currently displaying for the specified user.
 *
 * @param {string} fromUser - Username of the user who stopped typing
 */
function hideTypingIndicator(fromUser) {
    const indicatorContainer = document.getElementById("typing-indicator");

    // Only hide if it's currently for that user
    if (indicatorContainer && indicatorContainer.style.display === "block") {
        const isCurrent = indicatorContainer.innerHTML.includes(fromUser);
        if (isCurrent) {
            indicatorContainer.style.display = "none";
        }
    }

    clearTimeout(window.typingTimeout);
}
/**
 * Opens a chat window with the selected user
 * @param {string} username - Username to chat with
 */
function openChat(username) {
    numberOfMessages = 10;
    unreadMessages[username] = false;
    saveUnreadMessages();

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
      <div id="typing-indicator" class="typing-indicator" style="display: none;"></div> 
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message...">
        <button onclick="sendMessage('${username}')">Send</button>
      </div>
    `;

    // Store who we're chatting with
    window.currentChatPartner = username;
    connectWebSocket();
    requestMessageHistory(username);

    // Set up Enter key for sending
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
        sendTypingEvent(username);
        if (e.key === "Enter") {
            sendMessage(username);
        }
    });
    const chatMessages = document.getElementById("chat-messages");
    let isThrottled = false;

    // scroll event for loading more messages
    chatMessages.addEventListener('scroll', () => {
        if (chatMessages.scrollTop <= 5 && !isThrottled) {
            isThrottled = true;

            // Set the flag that we're loading more messages
            isLoadingMoreMessages = true;
            numberOfMessages += 10;
            requestMessageHistory(username);

            // Throttle to prevent multiple rapid requests
            setTimeout(() => {
                isThrottled = false;
            }, 1000);
        }
    });
}

/**
 * Creates the chat window DOM element
 * @returns {HTMLElement} The created chat window element
 */
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
/**
 * Initiates sending a message to another user
 * @param {string} recipient - Username of the message recipient
 */
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
    updateLastMessageTime(recipient);
}
    // Clear the input field
    input.value = "";
}
/**
 * Sends the actual message through the WebSocket
 * @param {string} recipient - Username of the message recipient
 * @param {string} message - Message content to send
 */
function sendActualMessage(recipient, message) {
    // Create the message object
    const messageObj = {
        from: window.currentUsername, // Add sender information
        to: recipient,
        message: message
    };
    // Send the message
    socket.send(JSON.stringify(messageObj));

    // send stoptyping event right after
    socket.send(JSON.stringify({
        type: "stop_typing",
        from: window.currentUsername,
        to: recipient
    }));
}
/**
 * Requests message history between current user and another user
 * @param {string} otherUser - Username of the other chat participant
 */
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
/**
 * Sends the actual history request through the WebSocket
 * @param {string} otherUser - Username of the other chat participant
 */
function sendHistoryRequest(otherUser) {
    // Create history request object
    const requestObj = {
        type: "fetchMessages",
        from: window.currentUsername,
        to: otherUser,
        numberOfMessages: numberOfMessages
    };
    // Send the request
    socket.send(JSON.stringify(requestObj));
}
/**
 * Fetches the current user's username from the server
 * @returns {Promise<string>} Promise that resolves to the current username
 */
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
            return "Guest";
        }
    } catch (error) {
        console.error("Error fetching current username:", error);
        return "Guest";
    }
}