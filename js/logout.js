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
            // Clear the authToken from localStorage
            document.cookie = "sessionID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Set cookie to expire
            // Redirect to the login page
            history.pushState({}, '', '/login');

            loadLoginPage();
            handleRoute();
        } else {
            console.log('Logout failed');
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
}
