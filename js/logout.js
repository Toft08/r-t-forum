document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-button');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            console.log('Logging out...');
            logout(); 
        });
    } else {
        console.error('Logout button not found');
    }
});

function logout() {
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
            document.getElementById("chat-window").style.display = "none";
            document.getElementById("chat-window").innerHTML = "";
            
            // loadLoginPage();
            handleRoute();
        } else {
            console.log('Logout failed');
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
}
