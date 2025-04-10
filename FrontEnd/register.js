/*
HOW sendToDB WORKS: 

1. User enters valid username and pass
2. sendToDB sends POST req. to /register
  a. Content is currently being sent as JSON (See headers)
  b. Stringify makes sure uname and password are being sent as a string
3. Node.js recieves this request
  a. .then waits for the servers response, response.text() is the response
4. This message object in the DOM displays the server's response

*/

/*
See the final else statement: When a user has all valid inputs for registration, the front-end code calls 
             "sendToDB", localStorage simply allows the browser to remember login credentials, 
             location.href reroutes the user to the homepage
*/
localStorage.removeItem('authtoken');
localStorage.removeItem('username');
const SHA256 = new Hashes.SHA256();

async function register(event) {

  event.preventDefault();

  const messagefield = document.getElementById("message");
  var username = document.getElementById("username").value.trim(); // user's username
  var password = document.getElementById("password").value.trim(); // user's password
  var password2 = document.getElementById("password2").value.trim();
  var securityQuestion = document.getElementById("questions").value; // selected security question
  var securityAnswer = document.getElementById("securityAnswer").value.trim(); // user's security answer
  var conditions = ["\\", "<", ">", "|", "/", "=", "&", "#"];

if (username.length > 16) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Username cannot exceed 16 characters";
} else if (conditions.some(el => username.includes(el))) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Username cannot contain special characters: /\\|<>=&#";
} else if (password.length > 16) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Password cannot exceed 16 characters";
} else if (conditions.some(el => password.includes(el))) {
  messagefield.style.color = "red";
  messagefield.innerHTML = "Password cannot contain special characters: /\\|<>=&#";
} else if (password !== password2) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Passwords do not match";
} else if (username.length === 0 || password.length === 0) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Please fill in all fields";
} else if (securityQuestion === "default") {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Please select a security question";
} else if (securityQuestion === "") {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Please select a security question";
} else if (securityAnswer.length === 0) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Please provide an answer to the security question";
} else if (conditions.some(el => securityAnswer.includes(el))) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Security answer cannot contain special characters: /\\|<>=&#";
} else if (password.length < 8 || /[A-Z]/.test(password) == false || /\d/.test(password) == false) {
  messagefield.style.color = "#f56476";
  messagefield.innerHTML = "Password must be at least 8 characters long and must include at least one capital letter and one number";
} else { // User accepted
  let hashedPassword = SHA256.hex(password); // ACTUALLY HASH PASSWORD
  let hashedSecurityAnswer = SHA256.hex(securityAnswer); //ACTUALLY HASH SECURITY QUESTION ANSWER
  const response = await sendToDB(username, hashedPassword, securityQuestion, hashedSecurityAnswer); // ACTUALLY SEND TO DB
   
  if (response.message === "Username already exists") {
    messagefield.style.color = "#f56476";
    messagefield.innerHTML = "Username already exists. Please choose another.";
  } else if (response.message === "A required field is missing") {
    messagefield.style.color = "#f56476";
    messagefield.innerHTML = "A required field is missing. Please ensure all fields are filled.";
  } else if (response.message === "User registered successfully") {
    localStorage.setItem("authtoken", response.token);
    localStorage.setItem("username", username);
    sessionStorage.setItem('justLoggedIn', 'true'); /////////////////////COOKIE HERE
    location.href = "homepage.html"; // Redirect to homepage
  } else {
    messagefield.style.color = "#f56476";
    messagefield.innerHTML = "An error occurred. Please try again.";
  }
}
  return false;
}

async function sendToDB(uname, pword, securityq, securityq_ans) { // Whatever the user inputs
  try {
    console.log("made it to reg.js call");
    let response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, password: pword, securityQuestion: securityq, securityAnswer: securityq_ans })
    });

    console.log("Server Response:", response);
    let data = await response.json();
    console.log("Server Response:", data);
    console.log("Server Response:", response.message);
    return data;
  } catch (error) {
    console.error("Fetch Error:", error);
    document.getElementById("message").innerText = "Error connecting to server.";
    return "Error";
  }
}
