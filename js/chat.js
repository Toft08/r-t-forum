document.addEventListener("DOMContentLoaded", () => {
    const activeUsersPopup = document.querySelector('.active-users');
    const minimizeButton = document.getElementById('minimize-users');
    const currentUsername = document.getElementById('username-placeholder').textContent.trim();

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
        console.log("Chat opened:", username);
        console.log("Current user:", currentUsername);
        fetchPreviousMessages(currentUsername, username);
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

    function fetchPreviousMessages(sender, receiver) {
        fetch(`/api/getMessagesHandler?sender=${sender}&receiver=${receiver}`)
            .then(response => response.json())
            .then(messages => {
                const chatWindow = document.getElementById('chat-window');
                if (chatWindow) {
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
                }
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            });
    }

    // function attachUserClickHandlers() {
    //     const userElements = document.querySelectorAll('.user'); // Assuming '.user' is the class for user elements
    //     userElements.forEach(userElement => {
    //         userElement.addEventListener('click', () => {
    //             const username = userElement.textContent.trim();
    //             openChat(username);
    //         });
    //     });
    // }
    fetchAllUsers();
});