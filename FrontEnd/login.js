document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const message = document.getElementById("message");
  const SHA256 = new Hashes.SHA256();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const forbiddenChars = /[\\<>|\/=&#]/;

    // Input Validation
    if (!username || !password) {
      return showMessage("Please fill in all fields");
    }

    if (username.length > 16) {
      return showMessage("Username cannot exceed 16 characters");
    }

    if (forbiddenChars.test(username)) {
      return showMessage("Username cannot contain special characters: /\\|<>=&#");
    }

    if (password.length > 16) {
      return showMessage("Password cannot exceed 16 characters");
    }

    if (forbiddenChars.test(password)) {
      return showMessage("Password cannot contain special characters: /\\|<>=&#");
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return showMessage("Password must be at least 8 characters long and include at least one capital letter and one number");
    }

    // Hash password
    const hashedPassword = SHA256.hex(password);

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: hashedPassword })
      });

      let data = await response.json();

      if (!data.exists) {
        return showMessage("Incorrect Username or Password");
      }

      // Store token + redirect
      
      localStorage.setItem("authtoken", data.token); // <-- SET TOKEN
      sessionStorage.setItem("justLoggedIn", "true"); // <-- SKIP CHECK ON FIRST LOAD
      localStorage.setItem("username", username);
      window.location.href = "homepage.html";
    } catch (err) {
      console.error("Login failed:", err);
      showMessage("Error connecting to server.");
    }
  });

  function showMessage(text) {
    message.style.color = "#ff1744";
    message.style.margin = "auto";
    message.textContent = text;
  }
});
