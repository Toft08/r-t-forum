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
        const chatMessages = document.getElementById("chat-messages");
        const message = document.createElement("div");
        message.textContent = event.data;
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

// Fetch users every 5 seconds
setInterval(fetchActiveUsers, 5000);
fetchActiveUsers();