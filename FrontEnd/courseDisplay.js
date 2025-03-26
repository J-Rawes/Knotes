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

document.addEventListener("DOMContentLoaded", function () {
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    let username = ca.length > 1 ? ca[1] : "Guest";

    window.onload = function () {

        // Get the course name from the URL (see courseSearch.js)
        const courseName = localStorage.getItem("courseName");
        const courseID = localStorage.getItem("courseID");
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
                button.onclick = () => displayNote(note.noteID);

                // Append button to container
                container.appendChild(button);
            });
        }

        function sortNotes(criteria) {
            if (criteria === "title") {
                filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
            } else if (criteria === "likes") {
                filteredNotes.sort((a, b) => b.num_likes - a.num_likes);
            }

            generateButtons(filteredNotes); // Generate buttons for notes
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

        function displayNote() {
            loadArrayTest();
            loadTArrayTest();
            displayImg.src = imageArray[0]; // Use the first image for testing
            displayImg.onload = () => {
                imgCanvas.width = displayImg.naturalWidth;
                imgCanvas.height = displayImg.naturalHeight;
                imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);
                const modal = document.getElementById("noteModal");
                modal.style.display = "block";  // Show the modal
                txtCanvas.innerHTML = txtArray[0]; // Use the first text for testing
            }
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
            // Dummy data for testing purposes
            const dummyCourseInfo = {
                course_name: "Introduction to Programming",
                institution: "Example University",
                description: "This is a dummy course description for testing purposes."
            };

            notesArr = [
                { noteID: 1, title: "A Note 1", num_likes: 10 },
                { noteID: 1, title: "D Note 1", num_likes: 77 },
                { noteID: 2, title: "C Note 2", num_likes: 5 },
                { noteID: 3, title: "B Note 3", num_likes: 8 }
            ];

            filteredNotes = notesArr.slice(); // Initialize filteredNotes with all notes

            displayCourseInfo(dummyCourseInfo);
            generateButtons(filteredNotes);

            // Uncomment the following code to fetch real data from the server
            /*
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

                    notesArr = data.noteNames;
                    filteredNotes = notesArr.slice(); // Initialize filteredNotes with all notes
                    generateButtons(filteredNotes); // Generate buttons for notes
                    displayCourseInfo(data.courseInfo); // Display course information

                })
                .catch(error => console.error('Error:', error));
            */
        }
    }
});

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