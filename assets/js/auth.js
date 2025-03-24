// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // Get the actual form elements, not the container divs
  const signupFormElement = document.querySelector("#signup-form form");
  const loginFormElement = document.querySelector("#login-form form");

  // Add event listeners to the form elements
  signupFormElement.addEventListener("submit", function(event) {
    event.preventDefault();
    signup();
  });

  loginFormElement.addEventListener("submit", function(event) {
    event.preventDefault();
    login();
  });
});

// Your existing showPage function seems fine - it's in your HTML

async function signup() {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  console.log("Sending signup request...", { username, email, password });
  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    });
    console.log("Response received:", response);
    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      const errorText = await response.text();  // This should work now
      console.error("Error response:", errorText);
      document.getElementById("signup-error").textContent = errorText || "Server error occurred.";
      return;
    }

    const data = await response.json();

    if (data.success) {
      alert("Signup successful!");
      showPage('login-form');  // Use your existing showPage function
    } else {
      // Handle server-side error messages
      document.getElementById("signup-error").textContent = data.error || "Unknown error occurred.";
    }
  } catch (error) {
    console.error("Signup error:", error);
    document.getElementById("signup-error").textContent = 
      "Cannot connect to server. Please check if the server is running.";
  }
}

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    // Add proper error handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      document.getElementById("login-error").textContent = errorText || "Server error occurred.";
      return;
    }

    const data = await response.json();

    if (data.success) {
      alert("Login successful!");
      // Redirect to home page or dashboard
      window.location.href = "/dashboard"; // Or wherever you want to redirect
    } else {
      document.getElementById("login-error").textContent = data.message || "Login failed.";
    }
  } catch (error) {
    console.error("Login error:", error);
    document.getElementById("login-error").textContent = 
      "Cannot connect to server. Please check if the server is running.";
  }
}