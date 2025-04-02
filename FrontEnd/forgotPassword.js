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

const SHA256 = new Hashes.SHA256();
var exists = false;

async function login(event) {

  event.preventDefault();

  var username = document.getElementById("username").value; //user's username
  var password = document.getElementById("password").value; //user's password
  var confpassword = document.getElementById("confPassword").value; //user's password
  var conditions = ["\\", "<", ">", "|", "/", "=", "&", "#"];


  if (password !== confpassword) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Passwords do not match";
  } else if (username.length > 16) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Username cannot exceed 16 characters";
  }

  if (username.length > 16) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Username cannot exceed 16 characters";
  } else if (conditions.some(el => username.includes(el))) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Username cannot contain special characters: /\\|<>=&#";
  } else if (password.length > 16) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Password cannot exceed 16 characters";
  } else if (conditions.some(el => password.includes(el))) {
    document.getElementById("message").style.color = "red";
    document.getElementById("message").innerHTML = "Password cannot contain special characters: /\\|<>=&#";
  } else if (username.length === 0 || password.length === 0) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Please fill in all fields";
  } else if (password.length < 8 || /[A-Z]/.test(password) == false || /\d/.test(password) == false) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Password must be at least 8 characters long and must include at least one capital letter and one number";
  } else { 
    //constrains met
    console.log(username, password);
    let hashedPassword = SHA256.hex(password); //ACTUALLY HASH PASSWORD
    console.log(hashedPassword);

    response = await checkWithDB(username, hashedPassword); //ACTUALLY SEND TO DB

    if (response === false) {
      document.getElementById("message").style.color = "#f56476";
      document.getElementById("message").innerHTML = "Incorrect Username or Password";
      return false;
    }

    // Redirect to login page after successful password reset
    document.getElementById("message").style.color = "green";
    document.getElementById("message").innerHTML = "Password reset successful! Redirecting...";
    setTimeout(() => {
    location.href = "login.html"; // Replace with the correct path to your login page
}   , 2000); // Redirect after 2 seconds
  }

  return false;
}

async function checkWithDB(uname, pword) { // Whatever the user inputs
  try {
    let response = await fetch('/resetPassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: uname, password: pword })
    })

    let data = await response.json();  // Convert response to JSON
    return data;

  } catch (error) {
    console.error("Fetch Error:", error);
    document.getElementById("message").innerText = "Error connecting to server.";
    return "Error";
  }
}
