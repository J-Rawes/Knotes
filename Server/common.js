function getCookie(name) {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const target = cookies.find(cookie => cookie.startsWith(`${name}=`));
    return target ? target.split('=')[1] : null;
}

async function validateTokenAndDisplayUser() {
    const token = getCookie('authtoken');

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
                userDisplay.textContent = `Welcome, ${username}`;
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
