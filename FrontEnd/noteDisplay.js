//const { not } = require("is");

let iArrPointer = 0; // Image pointer 
let tArrPointer = 0; // Text pointer (no "texting" while driving though!)

let notesArr = [];
let filteredNotes = [];
let imageArray = [];
let txtArray = [];

// Current note and course info. 
let currentNote = 0;
let courseID;
let likedNotes; // This variable is feeling a bit "unliked" since it's not used anywhere.
var liked;

// Grab the canvas elements and their contexts. Time to "draw" some conclusions!
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("txtCanvas");
const imgCtx = imgCanvas.getContext("2d");
const displayImg = new Image(); // Our image loader
const innerTxt = document.getElementById("innerTxt");

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

        // If the response is empty or weird, RUN
        if (!response || !response.noteInfo) {
            console.error("Invalid response for noteID:", noteID, response);
            return;
        }

        // Load up the images and text
        imageArray = response.images || [];
        txtArray = response.text || [];

        // Get the note's "tombstone" info. Don't worry, it's not as grave as it sounds.
        const noteTombstone = response.noteInfo;
        document.getElementById("noteTitle").textContent = noteTombstone.title;
        document.getElementById("noteAuthor").textContent = `By: ${noteTombstone.username}`;

        // If there are images, show the first one and prepare the canvas.
        if (imageArray.length > 0) {
            imgCanvas.style.display = "block";
            if (imageArray.length > 1) document.getElementById("i").style.display = "block"; // Show the "next" button if needed.
            displayImg.src = imageArray[0]; // Load the first image.
            displayImg.onload = null; // Clear any previous onload handler.
            displayImg.onload = () => {
                imgCanvas.width = displayImg.naturalWidth; // Set canvas size to match the image.
                imgCanvas.height = displayImg.naturalHeight;
                imgCtx.drawImage(displayImg, 0, 0); // Draw the image on the canvas.
            };
        }

        // If there's text, show the first chunk
        if (txtArray.length > 0) {
            innerTxt.innerHTML = txtArray[0];
            txtCanvas.style.display = "block";
            if (txtArray.length > 1) document.getElementById("t").style.display = "block"; // Show the "next" button if needed.
        }

    } catch (err) {
        console.error("Error displaying note:", err);
    }
}



// Fetch note info
async function getNoteInfo(noteID) {
    const response = await fetch('/getNoteTombstoneInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteID }) // Send the note ID in the body. Very official.
    });

    return await response.json(); // Return the parsed response
}

// Function to go to the next or previous image
function nextImg(forward) {
    if (imageArray.length === 0) return; // No images?
    iArrPointer = (forward ? (iArrPointer + 1) : (iArrPointer - 1 + imageArray.length)) % imageArray.length; // Move the pointer.
    displayImg.src = imageArray[iArrPointer]; // Load the new image.
    displayImg.onload = null; // Clear any previous onload handler.
    displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth; // Resize the canvas.
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0); // Draw the new image.
    };
}

function openModal() {
    const modal = document.getElementById("textModal");
    const textInput = document.getElementById("textInput");
    modal.style.display = "block";  // Show the modal
}

// Close Modal Function
function closeModal(modalType) {
    const modal = document.getElementById(String(modalType));
    modal.style.display = "none";  // Hide the modal
}

// Function to go to the next or previous text chunk
function nextTxt(forward) {
    tArrPointer = (forward ? (tArrPointer + 1) : (tArrPointer - 1 + txtArray.length)) % txtArray.length; // Move the pointer.
    txtCanvas.innerHTML = txtArray[tArrPointer]; // Update the text
}

// Function to like a note. Because everyone loves a little validation.
// function likeNote() {
//     document.getElementById("like-button").style.backgroundColor = "#14FFEC";
//     document.getElementById("like-button").style.color = "#212121";
//     const username = localStorage.getItem("username");

//     fetch('/likeNote', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ currentNote, courseID, username }) // Send the love to the server.
//     }).catch(err => console.error('Error liking note:', err)); // If it fails, no love lost.
// }

// Function to download the current note
function downloadNote() {
    const image = displayImg.src;
    const downloadLink = document.getElementById('downloadBtn');
    downloadLink.href = image; // Set the download link to the image source.
    downloadLink.download = document.getElementById("noteTitle").textContent; // Name the file after the note title
}

// Function to generate comments based on db data
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


// async function seeIfNoteIsLiked() {
//     try {
//         const response = await fetch('/isNoteLiked', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ username: username, noteID: noteID })
//         });

//         if (!response.ok) {
//             console.error('Error checking if note is liked:', response.statusText);
//             return false;
//         }

//         const data = await response.json();
//         return data.isLiked || false; // Assuming the server returns an `isLiked` boolean
//     } catch (error) {
//         console.error('Error checking if note is liked:', error);
//         return false;
//     }
// }

function likeNote() {
    const noteID = localStorage.getItem("noteID");
    const username = localStorage.getItem("username");
    if (liked) {
        //unsaves the course
        fetch('/unlikeNote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({noteID: noteID, username: username })
        })
        .then(() => {
            liked = false;
            document.getElementById("like-button").textContent = "♡";
        })

        document.getElementById("like-button").style.backgroundColor = "#212121";
        document.getElementById("like-button").style.color = "#fff";
    } else {
        //saves the course
        fetch('/likeNote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteID: noteID, username: username  })
        })
        .then(() => {
            liked = true;
            document.getElementById("like-button").textContent = "♥";
        })

        document.getElementById("like-button").style.backgroundColor = "#14FFEC";
        document.getElementById("like-button").style.color = "#212121";
    }
}

// Start it all
window.addEventListener("DOMContentLoaded", async () => {
    const noteName = localStorage.getItem("noteName");
    const noteID = localStorage.getItem("noteID");
    const username = localStorage.getItem("username");
    fetch('/isNoteLiked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({noteID: noteID, username: username })
    })
    .then(res => res.json())
    .then(data => {
        liked = data.isLiked;
        console.log("Liked note status:", liked);
        if (liked) {
            document.getElementById("like-button").textContent = "♥";
            document.getElementById("like-button").style.backgroundColor = "#14FFEC";
            document.getElementById("like-button").style.color = "#212121";
        } else {
            document.getElementById("like-button").textContent = "♡";
            document.getElementById("like-button").style.backgroundColor = "#212121";
            document.getElementById("like-button").style.color = "#fff";
        }
    })
    .catch(error => console.error('Error checking saved course:', error));

    if (!username) {
        alert("Please log in first");
        return (window.location.href = "login.html");
    }

    await getNoteInfo(noteID);
    await displayNote(noteID);
    generateComments(noteID);

    window.nextImg = nextImg;
    window.nextTxt = nextTxt;
});
