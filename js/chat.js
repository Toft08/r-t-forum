function fetchActiveUsers() {
    fetch("/api/active-users")
        .then((response) => response.json())
        .then((users) => {
            const userList = document.getElementById("active-users-list");
            userList.innerHTML = ""; // Clear old users

            users.forEach((user) => {
                const li = document.createElement("li");
                li.textContent = user;
                li.style.cursor = "pointer";
                li.onclick = () => openChat(user); // Open chat when user is clicked

                userList.appendChild(li);
            });
        })
        .catch((error) => console.error("Error fetching active users:", error));
}
function openChat(username) {
    const chatWindow = document.getElementById("chat-window");
    if (!chatWindow) {
        console.error("Chat window element not found!");
        return;
    }
    chatWindow.style.display = "block";
    chatWindow.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>Chat with ${username}</h3>
          <button onclick="closeChat()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
        </div>
        <div id="chat-messages" style="height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;"></div>
        <input type="text" id="chat-input" placeholder="Type a message...">
        <button onclick="sendMessage('${username}')">Send</button>
    `;

    // Open WebSocket connection
    connectWebSocket(username);
}

function closeChat() {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
        chatWindow.style.display = "none";
    }
    if (ws) {
        ws.close(); // Close WebSocket connection
        ws = null; // Reset WebSocket variable
    }
}
let ws;

function connectWebSocket(username) {
    if (ws) {
        ws.close(); // Close previous connection
    }

    ws = new WebSocket(`ws://localhost:8080/api/ws/chat?username=${username}`);

    ws.onmessage = (event) => {
        console.log("mahdi is here")
        const data = JSON.parse(event.data);
        console.log(data)
        const chatMessages = document.getElementById("chat-messages");
        const message = document.createElement("div");
        message.textContent = data;
        chatMessages.appendChild(message);
    };
}
function sendMessage(username) {
    const input = document.getElementById("chat-input");
    if (ws && ws.readyState === WebSocket.OPEN && input.value.trim()) {
        const msg = JSON.stringify({
            from: currentUsername, // Current user sending the message
            to: username, // Recipient username
            message: input.value,
        });

        console.log("Sending message:", msg);
        ws.send(msg);
        input.value = "";
    } else {
        console.error("WebSocket is not open or input is empty.");
    }
}
let currentUsername = '';
let receiver = '';

function fetchPreviousMessages(sender, receiver) {
    fetch(`/api/getMessagesHandler?sender=${sender}&receiver=${receiver}`)
        .then(response => response.json())
        .then(messages => {
            const chatWindow = document.getElementById('chat-window');
            chatWindow.innerHTML = '';  // Clear the current chat window

            // Check if messages is a valid array
            if (Array.isArray(messages)) {
                messages.forEach(msg => {
                    const messageElement = document.createElement('div');
                    messageElement.textContent = `${msg.sender}: ${msg.content} (${msg.created_at})`;
                    chatWindow.appendChild(messageElement);
                });
            } else {
                console.error('Received data is not a valid array:', messages);
                chatWindow.innerHTML = '<p>No messages found.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });
}



// Fetch users every 5 seconds
setInterval(fetchActiveUsers, 5000);
fetchActiveUsers();