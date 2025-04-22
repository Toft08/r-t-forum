function logout() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin', // Ensure the session cookie is sent
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Redirect to the login page
            updateUsernameDisplay('Guest');
            history.pushState({}, '', '/login');
            const chatWindow = document.getElementById("chat-window");
            if (chatWindow) {
                chatWindow.style.display = "none";
                chatWindow.innerHTML = "";
            }
            handleRoute();
        } else {
            console.log('Logout failed');
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
}
