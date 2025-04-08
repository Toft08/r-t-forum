document.addEventListener("DOMContentLoaded", async () => {
    const activeUsersPopup = document.querySelector('.active-users');
    const minimizeButton = document.getElementById('minimize-users');
    const usernamePlaceholder = document.getElementById('username-placeholder');
    const username = await fetchCurrentUsername();
    usernamePlaceholder.textContent = username; // Update the placeholder
    window.currentUsername = username; // Set globally for use in other functions

    async function openChat(username) {
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

        console.log("Chat opened:", username);

        // Ensure currentUsername is set
        if (!window.currentUsername) {
            window.currentUsername = await fetchCurrentUsername();
        }

        console.log("Current user:", window.currentUsername);

        // Fetch previous messages
        await fetchPreviousMessages(window.currentUsername, username);

        // Open WebSocket connection
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectWebSocket(username);
        }
    }
    window.openChat = openChat;
    function closeChat() {
        const chatWindow = document.getElementById("chat-window");
        if (chatWindow) {
            chatWindow.style.display = "none";
        }
        if (socket) {
            socket.close(); // Close WebSocket connection
            socket = null; // Reset WebSocket variable
        }
    }
    window.closeChat = closeChat;
    function sendMessage(username) {
        const input = document.getElementById("chat-input");
        if (socket && socket.readyState === WebSocket.OPEN && input.value.trim()) {
            const msg = JSON.stringify({
                from: currentUsername, // Current user sending the message
                to: username, // Recipient username
                message: input.value,
            });

            console.log("Sending message:", msg);
            socket.send(msg);
            input.value = "";
        } else {
            console.error("WebSocket is not open or input is empty.");
        }
    }
    window.sendMessage = sendMessage;
    let receiver = '';

    async function fetchPreviousMessages(sender, receiver) {
        console.log("Requesting messages for sender:", sender, "and receiver:", receiver);

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "fetchMessages",
                sender: sender,
                receiver: receiver,
            }));
        } else {
            console.error("WebSocket is not open. Cannot fetch messages.");
        }
    }

    // Handle WebSocket messages
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "messages") {
            console.log("Received messages:", data.messages);

            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = ''; // Clear the current chat window

                if (Array.isArray(data.messages)) {
                    data.messages.forEach(msg => {
                        const messageElement = document.createElement('div');
                        messageElement.textContent = `${msg.sender}: ${msg.content} (${msg.created_at})`;
                        chatMessages.appendChild(messageElement);
                    });
                } else {
                    console.error('Received data is not a valid array:', data.messages);
                    chatMessages.innerHTML = '<p>No messages found.</p>';
                }
            }
        } else if (data.type === "error") {
            console.error("Error from WebSocket:", data.message);
        }
    };

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

    fetchAllUsers();
});