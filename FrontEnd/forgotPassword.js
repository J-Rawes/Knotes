document.addEventListener("DOMContentLoaded", () => {

const SHA256 = new Hashes.SHA256();

// Step 1: Verify Username
document.getElementById("checkUsernameButton").addEventListener("click", async () => {
    console.log("yippee");
    const username = document.getElementById("username").value.trim();
    console.log(username);
    
    if (username === "") {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "Please enter your username.";
        return;
    }

    try {
        const response = await fetch('/verifyUsername', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (data.exists) {
            // Username found, display the security question
            document.getElementById("usernameForm").style.display = "none";
            document.getElementById("securityQuestionForm").style.display = "block";
            document.getElementById("securityQuestionLabel").innerText = data.securityQuestion;
        } else {
            document.getElementById("message").style.color = "#f56476";
            document.getElementById("message").innerText = "Username not found.";
        }
    } catch (error) {
        console.error("Error verifying username:", error);
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "An error occurred. Please try again.";
    }
});

// Step 2: Verify Security Question Answer
document.getElementById("checkSecurityAnswerButton").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const securityAnswer = document.getElementById("securityAnswer").value.trim();

    if (!securityAnswer) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "Please enter your security answer.";
        return;
    }

    try {
        let hashedSecurityAnswer = SHA256.hex(securityAnswer); // Hash the security answer before sending it
        console.log(hashedSecurityAnswer);
        let response = await fetch('/verifySecurityAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, securityAnswer: hashedSecurityAnswer })
        });

        let data = await response.json();

        console.log(data);

        if (data.success) {
            // Security answer is correct, display the reset password form
            document.getElementById("securityQuestionForm").style.display = "none";
            document.getElementById("resetPasswordForm").style.display = "block";
        } else {
            document.getElementById("message").style.color = "#f56476";
            document.getElementById("message").innerText = "Incorrect security answer.";
        }
    } catch (error) {
        console.error("Error verifying security answer:", error);
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "An error occurred. Please try again.";
    }
});

// Step 3: Reset Password
document.getElementById("resetPasswordButton").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!newPassword || !confirmPassword) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "Please fill in all password fields.";
        return;
    }

    if (newPassword !== confirmPassword) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "Passwords do not match.";
        return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "Password must be at least 8 characters long and include at least one capital letter and one number.";
        return;
    }

    try {
        const hashedPassword = SHA256.hex(newPassword); // Hash the password before sending it
        const response = await fetch('/resetPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, newPassword: hashedPassword })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById("message").style.color = "green";
            document.getElementById("message").innerText = "Password reset successful! Redirecting to login...";
            setTimeout(() => {
                window.location.href = "login.html"; // Redirect to login page
            }, 2000);
        } else {
            document.getElementById("message").style.color = "#f56476";
            document.getElementById("message").innerText = "Failed to reset password. Please try again.";
        }
    } catch (error) {
        console.error("Error resetting password:", error);
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerText = "An error occurred. Please try again.";
    }
});

async function verifyIdentity(username, securityQuestion, securityAnswer) {
    const response = await fetch('/verifyIdentity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, securityQuestion, securityAnswer })
    });
    return response.text();
}

async function resetPassword(username, newPassword) {
    const response = await fetch('/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword })
    });
    return response.text();
}

});
