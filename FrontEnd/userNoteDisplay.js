let iArrPointer = 0; // Image pointer 
let tArrPointer = 0; // Text pointer

let notesArr = [];
let filteredNotes = [];
let imageArray = [];
let txtArray = [];

// Current note and course info. 
let currentNote = 0;
let courseID;

// Grab the canvas elements and their contexts
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("txtCanvas");
const imgCtx = imgCanvas.getContext("2d");
const displayImg = new Image(); // Our image loader
const innerTxt = document.getElementById("innerTxt");

let comments = []; // Initialize comments array

// Function to display a note
async function displayNote(noteID) {
    try {
        currentNote = noteID;

        // Hide everything initially
        document.getElementById("i").style.display = "none";
        document.getElementById("t").style.display = "none";
        txtCanvas.style.display = "none";
        imgCanvas.style.display = "none";

        // Fetch the note info
        const response = await getNoteInfo(noteID);

        // If the response is empty or invalid
        if (!response || !response.noteInfo) {
            console.error("Invalid response for noteID:", noteID, response);
            return;
        }

        // Load up the images and text
        imageArray = response.images || [];
        txtArray = response.text || [];
        comments = response.comments || []; // Load comments from the response

        // Get the note's "tombstone" info
        const noteTombstone = response.noteInfo;
        document.getElementById("noteTitle").textContent = noteTombstone.title;
        document.getElementById("noteAuthor").textContent = `By: ${noteTombstone.username}`;

        // If there are images, show the first one and prepare the canvas
        if (imageArray.length > 0) {
            imgCanvas.style.display = "block";
            if (imageArray.length > 1) document.getElementById("i").style.display = "block"; // Show the "next" button if needed
            displayImg.src = imageArray[0]; // Load the first image
            displayImg.onload = () => {
                imgCanvas.width = displayImg.naturalWidth; // Set canvas size to match the image
                imgCanvas.height = displayImg.naturalHeight;
                imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height); // Clear the canvas before drawing
                imgCtx.drawImage(displayImg, 0, 0); // Draw the image on the canvas
            };
        }

        // If there's text, show the first chunk
        if (txtArray.length > 0) {
            innerTxt.innerHTML = txtArray[0];
            txtCanvas.style.display = "block";
            if (txtArray.length > 1) document.getElementById("t").style.display = "block"; // Show the "next" button if needed
        }

        // Generate comments
        generateComments(comments);

    } catch (err) {
        console.error("Error displaying note:", err);
    }
}

// Fetch note info
async function getNoteInfo(noteID) {
    const response = await fetch('/getNoteTombstoneInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteID })
    });

    return await response.json(); // Return the parsed response
}

// Function to go to the next or previous image
function nextImg(forward) {
    if (imageArray.length === 0) return; // No images?
    iArrPointer = (forward ? (iArrPointer + 1) : (iArrPointer - 1 + imageArray.length)) % imageArray.length; // Move the pointer
    displayImg.src = imageArray[iArrPointer]; // Load the new image
    displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth; // Resize the canvas
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height); // Clear the canvas before drawing
        imgCtx.drawImage(displayImg, 0, 0); // Draw the new image
    };
}

// Function to go to the next or previous text chunk
function nextTxt(forward) {
    tArrPointer = (forward ? (tArrPointer + 1) : (tArrPointer - 1 + txtArray.length)) % txtArray.length; // Move the pointer
    innerTxt.innerHTML = txtArray[tArrPointer]; // Update the text
}

// // Function to generate comments
// async function generateComments(noteID) {
//     try {
//         console.log(noteID);
//         // Fetch comments from the server
//         const response = await fetch('/getComments', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ noteID })
//         });
//         console.log(response);
//         if (!response.ok) {
//             throw new Error(`Error fetching comments: ${response.statusText}`);
//         }

//         const data = await response.json();
//         const commentsArray = data.comments || [];

//         // Get the comments container
//         const container = document.getElementById("comments");
//         container.innerHTML = ""; // Clear existing content

//         if (commentsArray.length === 0) {
//             // Display "No comments" message if there are no comments
//             const noCommentsMessage = document.createElement("p");
//             noCommentsMessage.textContent = "No comments yet. Be the first to comment!";
//             noCommentsMessage.className = "no-comments-message";
//             container.appendChild(noCommentsMessage);
//             return;
//         }

//         // Generate comments
//         commentsArray.forEach((comment) => {
//             // Create a div for each comment
//             let commentDiv = document.createElement("div");
//             commentDiv.className = "comment-div";

//             // Create an h2 for the comment author
//             let authorHeading = document.createElement("h2");
//             authorHeading.textContent = `${comment.uname}:`; // Assuming `comment.author` contains the author's name
//             authorHeading.className = "comment-author";

//             // Create a p for the comment text
//             let commentText = document.createElement("p");
//             commentText.textContent = comment.content; // Assuming `comment.text` contains the comment text
//             commentText.className = "comment-text";

//             // Append the author and text to the comment div
//             commentDiv.appendChild(authorHeading);
//             commentDiv.appendChild(commentText);

//             // Append the comment div to the container
//             container.appendChild(commentDiv);
//         });
//     } catch (error) {
//         console.error("Error generating comments:", error);
//         const container = document.getElementById("comments");
//         container.innerHTML = "<p class='error-message'>Failed to load comments. Please try again later.</p>";
//     }
// }

// // Function to add a comment
// async function addComment(author, text) {
//     try {
//         const response = await fetch('/addComment', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ noteID: currentNote, author, text })
//         });

//         const data = await response.json();
//         if (data.success) {
//             comments.push({ author, text }); // Add the new comment to the local array
//             generateComments(comments); // Regenerate the comments section
//         } else {
//             console.error("Failed to add comment:", data.message);
//         }
//     } catch (error) {
//         console.error("Error adding comment:", error);
//     }
// }

// Function to delete a note
async function deleteNote() {
    try {
        let response = await fetch('/deleteNote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ noteID: currentNote })
        });

        let data = await response.json();
        if (data.success) {
            window.location.href = `homepage.html`;
        } else {
            console.error("Failed to delete note:", data.message);
            document.getElementById("message").innerText = "Failed to delete note.";
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        document.getElementById("message").innerText = "Error connecting to server.";
    }
}

// Function to download a note
function downloadNote() {
    const element = document.createElement("a");
    const noteContent = {
        images: imageArray,
        text: txtArray
    };
    const file = new Blob([JSON.stringify(noteContent, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `note_${currentNote}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

async function sendComment() {

    const text = document.getElementById("textInput").value;
    const noteID = localStorage.getItem("noteID");
    const username = localStorage.getItem("username");

    try {
        const response = await fetch('/addComment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteID: noteID, author: username ,text: text })
        });

        const data = await response.json();

        if (data.success) {
            // Reload the page after successfully adding the comment
            window.location.reload();
        } else {
            console.error("Failed to add comment:", data.message);
            alert("Failed to add comment. Please try again.");
        }

    } catch (error) {
        console.error("Error adding comment:", error);
        alert("An error occurred while adding the comment. Please try again.");
    }  
}

async function generateComments(noteID) {
    try {
        console.log(noteID);
        // Fetch comments from the server
        const response = await fetch('/getComments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteID })
        });
        console.log(response);
        if (!response.ok) {
            throw new Error(`Error fetching comments: ${response.statusText}`);
        }

        const data = await response.json();
        const commentsArray = data.comments || [];

        // Get the comments container
        const container = document.getElementById("comments");
        container.innerHTML = ""; // Clear existing content

        if (commentsArray.length === 0) {
            // Display "No comments" message if there are no comments
            const noCommentsMessage = document.createElement("p");
            noCommentsMessage.textContent = "No comments yet. Be the first to comment!";
            noCommentsMessage.className = "no-comments-message";
            container.appendChild(noCommentsMessage);
            return;
        }

        // Generate comments
        commentsArray.forEach((comment) => {
            // Create a div for each comment
            let commentDiv = document.createElement("div");
            commentDiv.className = "comment-div";

            // Create an h2 for the comment author
            let authorHeading = document.createElement("h2");
            authorHeading.textContent = `${comment.uname}:`; // Assuming `comment.author` contains the author's name
            authorHeading.className = "comment-author";

            // Create a p for the comment text
            let commentText = document.createElement("p");
            commentText.textContent = comment.content; // Assuming `comment.text` contains the comment text
            commentText.className = "comment-text";

            // Append the author and text to the comment div
            commentDiv.appendChild(authorHeading);
            commentDiv.appendChild(commentText);

            // Append the comment div to the container
            container.appendChild(commentDiv);
        });
    } catch (error) {
        console.error("Error generating comments:", error);
        const container = document.getElementById("comments");
        container.innerHTML = "<p class='error-message'>Failed to load comments. Please try again later.</p>";
    }
}

function openModal() {
    const modal = document.getElementById("textModal");
    const textInput = document.getElementById("textInput");
    modal.style.display = "block";  // Show the modal
}

function closeModal(modalType) {
    const modal = document.getElementById(String(modalType));
    modal.style.display = "none";  // Hide the modal
}

// Event listener for DOMContentLoaded
window.addEventListener("DOMContentLoaded", async () => {
    const noteName = localStorage.getItem("noteName");
    const noteID = localStorage.getItem("noteID");
    currentNote = noteID;
    const username = localStorage.getItem("username");
    
    if (!username) {
        alert("Please log in first");
        return (window.location.href = "login.html");
    }

    console.log(noteID);
    await displayNote(noteID);
    generateComments(noteID);

    // Attach event listeners for adding comments
    document.getElementById("addCommentButton").addEventListener("click", () => {
        const author = document.getElementById("commentAuthor").value;
        const text = document.getElementById("commentText").value;

        if (author && text) {
            addComment(author, text);
            document.getElementById("commentAuthor").value = ""; // Clear input fields
            document.getElementById("commentText").value = "";
        } else {
            alert("Please fill out both fields before submitting.");
        }
    });

    window.nextImg = nextImg;
    window.nextTxt = nextTxt;
    window.addComment = addComment;
    window.downloadNote = downloadNote;
});
