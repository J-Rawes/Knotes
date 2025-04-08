
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

document.addEventListener("DOMContentLoaded", function () {
    const token = getCookie('authtoken'); // Retrieve the JWT token from localStorage

    if (token) {
        // Verify the token by calling the server's /protected route
        fetch('/protected', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired
                localStorage.removeItem('token'); // Clear the token
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.user) {
                // Display the user's name in the top-right corner
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) {
                    userDisplay.textContent = `Welcome, ${data.user.username}`;
                }
            } else {
                console.log('User not logged in or token invalid.');
            }
        })
        .catch(error => {
            console.error('Error verifying token:', error);
        });
    } else {
        console.log('No token found. User is not logged in.');
    }
});

