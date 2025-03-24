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

    // Check if the response body is empty
    if (response.status !== 204) {
      const data = await response.json();
      
      if (data.success) {
        alert("Signup successful!");
        showPage('login-form');  // Use your existing showPage function to show the login form
      } else {
        // Handle server-side error messages
        document.getElementById("signup-error").textContent = data.error || "Unknown error occurred.";
      }
    } else {
      console.error("Empty response body.");
      document.getElementById("signup-error").textContent = "No response received from the server.";
    }
  } catch (error) {
    console.error("Signup error:", error);
    document.getElementById("signup-error").textContent = 
      "Cannot connect to server. Please check if the server is running.";
  }
}
