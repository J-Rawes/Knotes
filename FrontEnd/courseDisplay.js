let iArrPointer = 0;
let tArrPointer = 0;
let notesArr = [];
let filteredNotes = [];
let imageArray = [];
let txtArray = [];
let currentNote = 0;
let courseID;
let username;
let likedNotes;
let saved;
let username = localStorage.getItem("username");
let courseID = localStorage.getItem("courseID");


const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("innerTxt");
const imgCtx = imgCanvas.getContext("2d");
const displayImg = new Image();

function displayCourseInfo(courseInfo) {
    const courseInfoContainer = document.getElementById("course-info");
    courseInfoContainer.innerHTML = `
        <h1>${courseInfo.course_name}</h1>
        <b>Institution: ${courseInfo.institution}</b>
        <div id="description"><p>${courseInfo.description}</p></div>
    `;
}

function generateButtons(notesArr) {
    const container = document.getElementById("button-container");
    container.innerHTML = "";

    notesArr.forEach((note) => {
        let button = document.createElement("button");
        let title = document.createElement("h1");
        let likeCount = document.createElement("p");

        title.textContent = note.title;
        likeCount.innerHTML = `&#x2665; ${note.num_likes}`;

        button.appendChild(title);
        button.appendChild(likeCount);
        button.onclick = () => displayNote(note.title, note.note_id);

        container.appendChild(button);
    });
}

function sortNotes(criteria) {
    if (criteria === "title") {
        filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
        generateButtons(filteredNotes);
    } else if (criteria === "likes") {
        filteredNotes.sort((a, b) => b.num_likes - a.num_likes);
        generateButtons(filteredNotes);
    } else if (criteria === "liked") {
        const username = localStorage.getItem("username");
        fetch('/getLikedNotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        })
        .then(res => res.json())
        .then(data => {
            likedNotes = (data.likedNotes || []).map(Number);
            const likedFiltered = notesArr.filter(note => likedNotes.includes(note.note_id));
            generateButtons(likedFiltered);
        })
        .catch(error => console.error('Error fetching liked notes:', error));
    }
}

function filterNotes(searchTerm) {
    filteredNotes = notesArr.filter(note => note.title.toLowerCase().includes(searchTerm));
    generateButtons(filteredNotes);
}

async function saveCourse() {
    console.log( saved +" "+courseid +" "+ username)
    if (saved) {
        //unsaves the course
        fetch('/unlikeCourse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseID: courseID, username: username })
        })
        .then(() => {
            saved = false;
            document.getElementById("save").textContent = "Save Course";
        })

        document.getElementById("save").style.backgroundColor = "#212121";
        document.getElementById("save").style.color = "#fff";
    } else {
        //saves the course
        fetch('/likeCourse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({courseID: courseID, username: username  })
        })
        .then(() => {
            saved = true;
            document.getElementById("save").textContent = "Unsave Course";
        })

        document.getElementById("save").style.backgroundColor = "#14FFEC";
        document.getElementById("save").style.color = "#212121";
    }
}

// async function displayNote(noteID) {
//        try {
//         currentNote = noteID;

//         document.getElementById("i").style.display = "none";
//         document.getElementById("t").style.display = "none";
//         txtCanvas.style.display = "none";
//         imgCanvas.style.display = "none";

//         const response = await populateNote(noteID);

//         if (!response || !response.noteInfo) {
//             console.error("Invalid response for noteID:", noteID, response);
//             return;
//         }

//         imageArray = response.images || [];
//         txtArray = response.text || [];

//         const noteTombstone = response.noteInfo;
//         document.getElementById("noteTitle").textContent = noteTombstone.title;
//         document.getElementById("noteAuthor").textContent = `By: ${noteTombstone.username}`;

//         if (imageArray.length > 0) {
//             imgCanvas.style.display = "block";
//             if (imageArray.length > 1) document.getElementById("i").style.display = "block";
//             displayImg.src = imageArray[0];
//             displayImg.onload = () => {
//                 imgCanvas.width = displayImg.naturalWidth;
//                 imgCanvas.height = displayImg.naturalHeight;
//                 imgCtx.drawImage(displayImg, 0, 0);
//             };
//         }

//         if (txtArray.length > 0) {
//             txtCanvas.innerHTML = txtArray[0];
//             txtCanvas.style.display = "block";
//             if (txtArray.length > 1) document.getElementById("t").style.display = "block";
//         }

//         // SHOW THE MODAL
//         document.getElementById("noteModal").style.display = "block";
//     } catch (err) {
//         console.error("Error displaying note:", err);
//     }
// }

async function getCourseNoteInfo(courseID) {
    try {
        const response = await fetch('/getCourseNoteInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseID })
        });

        const data = await response.json();
        notesArr = data.noteNames;
        filteredNotes = [...notesArr];
        generateButtons(filteredNotes);
        displayCourseInfo(data.courseInfo);
    } catch (error) {
        console.error('Error fetching course info:', error);
    }
}

async function populateNote(noteID) {
    const response = await fetch('/getNoteTombstoneInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteID })
    });

    return await response.json();
}

function closeModal(modalType) {
    const modal = document.getElementById(modalType);
    modal.style.display = "none";
}

function nextImg(forward) {
    iArrPointer = (forward ? (iArrPointer + 1) : (iArrPointer - 1 + imageArray.length)) % imageArray.length;
    displayImg.src = imageArray[iArrPointer];
    displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0);
    };
}

function nextTxt(forward) {
    tArrPointer = (forward ? (tArrPointer + 1) : (tArrPointer - 1 + txtArray.length)) % txtArray.length;
    txtCanvas.innerHTML = txtArray[tArrPointer];
}

// function likeNote(buttonEl) {
//     buttonEl.style.color = "red";
//     const username = localStorage.getItem("username");

//     fetch('/likeNote', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ currentNote, courseID, username })
//     }).catch(err => console.error('Error liking note:', err));
// }

// function downloadNote() {
//     const image = displayImg.src;
//     const downloadLink = document.getElementById('downloadBtn');
//     downloadLink.href = image;
//     downloadLink.download = document.getElementById("noteTitle").textContent;
// }

// Go back to previous page
const backLink = document.getElementById('back-link');
if (backLink) {
    backLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (document.referrer) {
            window.location.href = document.referrer;
        } else {
            window.history.back();
        }
    });
}

// Start it all
window.addEventListener("DOMContentLoaded", () => {
    const courseName = localStorage.getItem("courseName");
    courseID = localStorage.getItem("courseID");
    const username = localStorage.getItem("username");
    // Check to see if the user has already saved the course
    fetch('/isCourseLiked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseID, username })
    })
    .then(res => res.json())
    .then(data => {
        saved = data.isLiked;
        console.log("Saved course status:", saved);
        if (saved) {
            document.getElementById("save").style.backgroundColor = "#14FFEC";
            document.getElementById("save").style.color = "#212121";
        } else {
            document.getElementById("save").style.backgroundColor = "#212121";
            document.getElementById("save").style.color = "#fff";
        }
    })
    .catch(error => console.error('Error checking saved course:', error));


    if (!username) {
        alert("Please log in first");
        return (window.location.href = "login.html");
    }

    getCourseNoteInfo(courseID);
    sortNotes("title");

    document.getElementById("sort-button").addEventListener("click", () => {
        sortNotes(document.getElementById("sort-options").value);
    });

    document.getElementById("search").addEventListener("input", (e) => {
        filterNotes(e.target.value.toLowerCase());
    });

    if (saved) {
        document.getElementById("save").style.backgroundColor = "#14FFEC";
        document.getElementById("save").style.color = "#212121";
    } else {
        document.getElementById("save").style.backgroundColor = "#212121";
        document.getElementById("save").style.color = "#fff";
    }

    window.nextImg = nextImg;
    window.nextTxt = nextTxt;
});

function displayNote(noteName, noteID) {
    localStorage.setItem("noteName", noteName);
    localStorage.setItem("noteID", noteID);
    window.location.href = `noteDisplay.html`;    
}
