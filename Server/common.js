function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

document.addEventListener("DOMContentLoaded", () => {
    const token = getCookie('authtoken');

    if (!token) {
        console.log('No token found. User is not logged in.');
        return;
    }

    fetch('/protected', {
        method: 'POST', // your server expects POST, not GET
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            console.warn(`Token validation failed with status: ${response.status}`);
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (data?.user?.username) {
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                userDisplay.textContent = `Welcome, ${data.user.username}`;
            }
        } else {
            console.log('User not logged in or token is invalid.');
        }
    })
    .catch(error => {
        console.error('Error verifying token:', error);
    });
});
