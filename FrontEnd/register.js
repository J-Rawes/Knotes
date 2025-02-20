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


const client = require('./server.js'); //Grab client info from server.js

function login() {

  var username = document.logIn.user.value; //user's username
  var password = document.logIn.password.value; //user's password
  var password2 = document.logIn.password2.value;
  var conditions = ["\\","<",">","|","/","=","&","#"];

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
  } else if (password !== password2) {
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Passwords do not match";
  } else if (username.length === 0 || password.length === 0){
    document.getElementById("message").style.color = "#f56476";
    document.getElementById("message").innerHTML = "Please fill in all fields";
  } else { //User accepted
    sendToDB(username, password); //ACTUALLY SEND TO DB
    localStorage.setItem("username", username);
    location.href = "homepage.html";  
  }
  return false;
}

function sendToDB(uname, pword) { // Whatever the user inputs
  fetch('/register', { //Send a POST request to the Server /register route. (Frontend send data to server)
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: uname, password: pword })
  })
  .then(response => response.text())
  .then(data => {
      console.log(data);
      document.getElementById("message").innerText = data;
  })
  .catch(error => console.error('Error:', error));
}


