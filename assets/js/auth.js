document
  .getElementById("signup-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    signup();
  });

document
  .getElementById("login-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    login();
  });

function switchToLogin() {
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}

function switchToSignup() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("signup-form").style.display = "block";
}
async function signup() {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,  // Use values from form fields
        email: email,
        password: password,
      }),
    });

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      const errorText = await response.text();  // Get the raw text response if not OK
      console.error("Error response:", errorText);
      document.getElementById("signup-error").textContent = "Error during signup. Please try again.";
      return;
    }

    const data = await response.json();  // Parse the JSON response

    if (data.success) {
      alert("Signup successful!");
      switchToLogin();  // Optionally switch to login after successful signup
    } else {
      // Handle server-side error messages
      document.getElementById("signup-error").textContent = data.error || "Unknown error occurred.";
    }
  } catch (error) {
    console.error("Signup error:", error);
    document.getElementById("signup-error").textContent = "An error occurred during signup. Please try again.";
  }
}


async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (data.success) {
    alert("Login successful!");
    // Optionally, update the page to show user is logged in
  } else {
    document.getElementById("login-error").textContent = data.message;
  }
}
