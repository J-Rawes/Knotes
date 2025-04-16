
/*
async function validateTokenAndDisplayUser() {
    console.log("Made it here")
    const token = localStorage.getItem('authtoken');

    // Skip check if this is the first time after login/register
    if (sessionStorage.getItem('justLoggedIn')) {
        sessionStorage.removeItem('justLoggedIn'); // only skip once
        return;
    }

    if (!token) {
        console.log('No token found. User is not logged in.');
        return;
    }

    try {
        const response = await fetch('/protected', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.warn(`Token validation failed: ${response.status}`);
            return;
        }

        const data = await response.json();
        const username = data?.user?.username;

        if (username) {
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                userDisplay.textContent = `${username}`;
            } else {
                console.warn('Element with id "user-display" not found.');
            }
        } else {
            console.log('User not logged in or token is invalid.');
        }
    } catch (err) {
        console.error('Error verifying token:', err);
    }
}

document.addEventListener("DOMContentLoaded", validateTokenAndDisplayUser);
*/



// Function to validate the token stored in localStorage and display the username
async function validateTokenAndDisplayUser() {
    console.log("Starting token validation...");

    // Retrieve the authentication token from localStorage
    const token = localStorage.getItem('authtoken');

    // Skip token validation if this is the first time after login/register
    if (sessionStorage.getItem('justLoggedIn')) {
        sessionStorage.removeItem('justLoggedIn'); // Ensure it only skips validation once
        return;
    }

    // If no token is found, log the user as not logged in and exit
    if (!token) {
        console.log('No authentication token found. User is not logged in.');
        return;
    }

    try {
        // Send a GET request to the '/protected' endpoint for token validation
        const response = await fetch('/protected', {
            method: 'GET',
            headers: {
                // Include the token in the Authorization header
                'Authorization': `Bearer ${token}`
            }
        });

        // If the response is not successful, log a warning and exit
        if (!response.ok) {
            console.warn(`Token validation failed with status: ${response.status}`);
            return;
        }

        // Parse the response JSON
        const data = await response.json();
        
        // Extract the username from the response data
        const username = data?.user?.username;

        if (username) {
            // Find the element with ID 'user-display' and update its text content to the username
            const userDisplayElement = document.getElementById('user-display');
            if (userDisplayElement) {
                userDisplayElement.textContent = username;
            } else {
                console.warn('Element with id "user-display" not found in the DOM.');
            }
        } else {
            console.log('Token is invalid or user information is missing.');
        }
    } catch (error) {
        // Log any errors that occur during the token validation process
        console.error('An error occurred during token validation:', error);
    }
}

// Add an event listener to the DOMContentLoaded event to validate the token after the page loads
document.addEventListener("DOMContentLoaded", validateTokenAndDisplayUser);
