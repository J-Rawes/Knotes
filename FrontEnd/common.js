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
