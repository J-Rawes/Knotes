//const client = require('./server.js');

var iArrPointer = 0;
var tArrPointer = 0;
var notesArr = []; // Array to store notes
var filteredNotes = []; // Array to store filtered notes
var imageArray = [];
var txtArray = [];
var displayImg = new Image();
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("innerTxt");
const imgCtx = imgCanvas.getContext("2d");
var currentNote = 0;
var likedNotes;
var courseID;

document.addEventListener("DOMContentLoaded", function () {

    const username = localStorage.getItem("username");

    window.onload = function () {

        // Get the course name from the URL (see courseSearch.js)
        const courseName = localStorage.getItem("courseName");
        courseID = localStorage.getItem("courseID");
        console.log(courseName + " " + courseID);

        getCourseNoteInfo(courseID);

        document.getElementById("sort-button").addEventListener("click", function () {
            const sortOption = document.getElementById("sort-options").value;
            sortNotes(sortOption);
        });

        document.getElementById("search").addEventListener("input", function () {
            const searchTerm = this.value.toLowerCase();
            filterNotes(searchTerm);
        });

        sortNotes("title"); // Sort notes by title by default

        function generateButtons(notesArr) {
            const container = document.getElementById("button-container");
            container.innerHTML = ""; // Clear existing buttons

            notesArr.forEach((note) => {
                let button = document.createElement("button");

                // Create an h1 element for the note title
                let title = document.createElement("h1");
                title.textContent = `${note.title}`; // Set the note title as h1 content
                title.style.margin = "0"; // Optional: Remove default margin for h1

                // Create a p element for the like count
                let likeCount = document.createElement("p");
                likeCount.innerHTML = `&#x2665; ${note.num_likes}`; // Set the like count with heart icon
                likeCount.style.margin = "0"; // Optional: Remove default margin for p
                likeCount.style.fontSize = "18px"; // Optional: Adjust font size for the like count

                // Append the h1 and p to the button
                button.appendChild(title);
                button.appendChild(likeCount);
                // Set onclick event to display note
                button.onclick = () => displayNote(note.note_id);

                // Append button to container
                container.appendChild(button);
            });
        }

        function sortNotes(criteria) {
            if (criteria === "title") {
                filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
                generateButtons(filteredNotes); // Generate buttons for notes
            } else if (criteria === "likes") {
                filteredNotes.sort((a, b) => b.num_likes - a.num_likes);
                generateButtons(filteredNotes); // Generate buttons for notes
            } else if (criteria === "liked"){
                const username = localStorage.getItem("username");
                fetch('/getLikedNotes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        likedNotes = data.likedNotes || [];
                        likedNotes = data.likedNotes.map(noteID => parseInt(noteID, 10)) || [];

                        console.log("Liked Notes:", likedNotes);
                        console.log("All Notes:", notesArr.noteNames);
        
                        // Filter notes for the current course based on liked_notes
                        const filteredNotes = notesArr.noteNames.filter(note => likedNotes.includes(note.note_id));
                        console.log("Filtered Notes:", filteredNotes);

                        generateButtons(filteredNotes); // Generate buttons for notes
                    })
                    .catch(error => console.error('Error fetching liked notes:', error));
            }
        }

        function filterNotes(searchTerm) {
            filteredNotes = notesArr.filter(note => note.title.toLowerCase().includes(searchTerm));
            generateButtons(filteredNotes);
        }

        function loadArrayTest() {
            imageArray.push('testIMG.jpg');
            imageArray.push('testIMG2.jpg');
        }

        function loadTArrayTest() {
            txtArray.push("Hello world");
            txtArray.push("These would be notes displayed for the user");
            txtArray.push("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet fermentum ex, id congue libero porta nec. Ut sed mollis nulla. Sed tincidunt suscipit metus, id suscipit quam malesuada sit amet. Nullam lacinia auctor nibh, mattis interdum diam auctor quis. Cras pharetra mauris eu commodo scelerisque. Vestibulum suscipit nec massa at sollicitudin. Vivamus elementum vehicula pharetra. Mauris tincidunt, urna mattis vulputate posuere, ante felis iaculis sem, sed pellentesque lectus nibh quis risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aenean metus sem, tempor scelerisque nulla in, tincidunt sodales magna. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Praesent ornare eu lacus ac convallis. Praesent nulla turpis, tempus vitae lacus laoreet, tempor lacinia arcu. Donec porta accumsan cursus. Morbi id neque ornare, euismod metus eu, fringilla libero. Cras et tortor sed justo sagittis porttitor.");
        }

        async function displayNote(noteID) {

            currentNote = noteID;

            document.getElementById("i").style.display = "none"; // Show the arrow buttons
            document.getElementById("t").style.display = "none"; // Show the arrow buttons
            txtCanvas.style.display = "none"; // Hide the canvas if no text is available
            imgCanvas.style.display = "none"; // Hide the canvas if no image is available
            //Info from server

            let response = await populateNote(noteID);

            try {
                imageArray = response.images || [];
            } catch {
                imageArray = [];
            }
        
            try {
                txtArray = response.text || [];
            } catch {
                txtArray = [];
            }
            
            console.log(txtArray[0]);
            console.log(imageArray[0]);
            let noteTombstone = response.noteInfo;
            
            // console.log(response.noteInfo);
            console.log(imageArray[0]);

            document.getElementById("noteTitle").innerHTML = noteTombstone.title; // Set the note title in the modal
            document.getElementById("noteAuthor").innerHTML = noteTombstone.username; // Set the note author in the modal
            
            if (imageArray.length > 0) {
                console.log("There is something in the image array")
                imgCanvas.style.display = "block"; // Show the canvas if an image is available
                if (imageArray.length > 1) {
                    console.log("There is more than one image")
                    document.getElementById("i").style.display = "block"; // Show the arrow buttons
                }
                displayImg.src = imageArray[0]; // Use the first image for testing
                displayImg.onload = () => {
                    imgCanvas.width = displayImg.naturalWidth;
                    imgCanvas.height = displayImg.naturalHeight;
                    imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);
                }
            } else {
                console.log("There is nothing in the image array")
                imgCanvas.style.display = "none"; // Hide the canvas if no image is available
            }
            if (txtArray.length > 0) {
                console.log("There is something in the text array")
                txtCanvas.innerHTML = txtArray[0]; // Use the first text for testing
                txtCanvas.style.display = "block"; // Show the text canvas
                if (txtArray.length > 1) {
                    console.log("There is more than one text")
                    document.getElementById("t").style.display = "block"; // Show the arrow buttons
                }
            } else {
                console.log("There is nothing in the text array")
                txtCanvas.style.display = "none"; // Hide the canvas if no text is available
            }

            const modal = document.getElementById("noteModal");
            modal.style.display = "block";  // Show the modal
        }

        function loadImg() {
            const reader2 = new FileReader();
            reader2.onload = (e) => {
                displayImg.src = e.target.result;
            };

            reader2.onerror = (err) => {
                console.error("Error reading file:", err);
                alert("An error occurred while reading the file.");
            };

            reader2.readAsDataURL(imageArray[0]);
        }

        function closeModal(modalType) {
            const modal = document.getElementById(String(modalType));
            modal.style.display = "none";  // Hide the modal
        }

        function nextImg(foward) {
            if (foward) {
                if (iArrPointer == imageArray.length - 1) {
                    iArrPointer = 0;
                } else {
                    iArrPointer = iArrPointer + 1;
                }
            } else {
                if (iArrPointer == 0) {
                    iArrPointer = imageArray.length - 1;
                } else {
                    iArrPointer = iArrPointer - 1;
                }
            }
            displayImg.src = imageArray[iArrPointer];
            displayImg.onload = () => {
                imgCanvas.width = displayImg.naturalWidth;
                imgCanvas.height = displayImg.naturalHeight;
                imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);
                txtCanvas.innerHTML = txtArray[tArrPointer];
            }
        }

        function nextTxt(foward) {
            if (foward) {
                if (tArrPointer == txtArray.length - 1) {
                    tArrPointer = 0;
                } else {
                    tArrPointer = tArrPointer + 1;
                }
            } else {
                if (tArrPointer == 0) {
                    tArrPointer = txtArray.length - 1;
                } else {
                    tArrPointer = tArrPointer - 1;
                }
            }
            txtCanvas.innerHTML = txtArray[tArrPointer];
        }

        // Ensure nextImg and nextTxt functions are accessible
        window.nextImg = nextImg;
        window.nextTxt = nextTxt;

        function displayCourseInfo(courseInfo) {
            const courseInfoContainer = document.getElementById("course-info");
            courseInfoContainer.innerHTML = `
                <h1>${courseInfo.course_name}</h1>
                <b>Institution: ${courseInfo.institution}</b>
                <div id="description"><p>${courseInfo.description}</p></div>
            `;
        }

        function getCourseNoteInfo(courseID) { // Get note ID and title for the buttons 
            
            fetch('/getCourseNoteInfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseID }) // Send the course ID
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.noteNames || !data.courseInfo) {
                        console.error("Invalid response: ", data);
                        return;
                    }

                    notesArr = data
                    filteredNotes = notesArr.noteNames.slice(); // Initialize filteredNotes with all notes
                    generateButtons(filteredNotes); // Generate buttons for notes
                    displayCourseInfo(data.courseInfo); // Display course information

                })
                .catch(error => console.error('Error:', error));
            
        }
    }
});

async function populateNote(noteID) {
    try {
        const response = await fetch('/getNoteTombstoneInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ noteID }) // Send the course ID
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data; // Return the fetched data
    } catch (error) {
        console.error('Error fetching note data:', error);
        throw error; // Re-throw the error to handle it in displayNote()
    }
}


// Set the href of the "Back" link to the previous page
document.getElementById('back-link').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default link behavior
    if (document.referrer) {
      window.location.href = document.referrer; // Navigate to the previous page
    } else {
      window.history.back(); // Fallback to browser's back functionality
    }
});

function closeModal(modalType) {
    const modal = document.getElementById(String(modalType));
    modal.style.display = "none";  // Hide the modal
}

function nextImg(foward) {
    if (foward) {
        if (iArrPointer == imageArray.length - 1) {
            iArrPointer = 0;
        } else {
            iArrPointer = iArrPointer + 1;
        }
    } else {
        if (iArrPointer == 0) {
            iArrPointer = imageArray.length - 1;
        } else {
            iArrPointer = iArrPointer - 1;
        }
    }
    displayImg.src = imageArray[iArrPointer];
    displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);
        txtCanvas.innerHTML = txtArray[tArrPointer];
    }
}

function nextTxt(foward) {
    if (foward) {
        if (tArrPointer == txtArray.length - 1) {
            tArrPointer = 0;
        } else {
            tArrPointer = tArrPointer + 1;
        }
    } else {
        if (tArrPointer == 0) {
            tArrPointer = txtArray.length - 1;
        } else {
            tArrPointer = tArrPointer - 1;
        }
    }
    txtCanvas.innerHTML = txtArray[tArrPointer];
}

function likeNote(x) {
    x.style.color = "red";

    const username = localStorage.getItem("username");

    fetch('/likeNote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({currentNote, courseID, username})
    })
        .catch(error => console.error('Error:', error));
  }