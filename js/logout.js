// Function to handle the logout process
function logout() {
    // Clear session data or authentication tokens
    localStorage.removeItem('authToken'); 

    // Redirect the user to the homepage or login page
    window.location.href = '/login'; // Redirect to the login page
}

// Add an event listener to the logout button (if you have one)
document.getElementById('logout-button').addEventListener('click', function() {
    console.log('Logging out...');
    logout(); // Call the logout function
});
