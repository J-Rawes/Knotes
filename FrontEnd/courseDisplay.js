//const client = require('./server.js');

document.addEventListener("DOMContentLoaded", function () {
   let decodedCookie = decodeURIComponent(document.cookie);
   let ca = decodedCookie.split(';');
   username = ca[1];
}

window.onload = function () {
    var imageArray = new Array();
    var txtArray = new Array();
    var displayImg = new Image;
    const imgCanvas = document.getElementById("imgCanvas");
    const txtCanvas = document.getElementById("innerTxt");
    const imgCtx = imgCanvas.getContext("2d");

    //Get the course name from the URL (see courseSearch.js)
    const courseName = localStorage.getItem("courseName");
    const courseID = localStorage.getItem("courseID");
    console.log(courseName + " " + courseID);


    var iArrPointer = 0;
    var tArrPointer = 0;
   getCourseNoteInfo(courseID);
}

function generateButtons(notesArr) { 
    const container = document.getElementById("button-container");
    container.innerHTML = ""; // Clear existing buttons

        notesArr.forEach((noteID, index) => {
        let button = document.createElement("button");
        button.textContent = `${note.title}`; // Display note ID on the button

        // Set onclick event to display note
        button.onclick = () => displayNote(note.noteID);

        // Append button to container
        container.appendChild(button);
    });

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
    displayImg.src = imageArray[0];
    displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);
        const modal = document.getElementById("noteModal");
        modal.style.display = "block";  // Show the modal
        txtCanvas.innerHTML = txtArray[tArrPointer];
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

    if (foward==true) {
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

    if (foward==true) {
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
    //txtCtx.clearRect(0, 0, txtCanvas.width, txtCanvas.height);
    //txtCtx.fillText(txtArray[tArrPointer],10,20);
    txtCanvas.innerHTML = txtArray[tArrPointer];
}

function displayCourseInfo(courseInfo) {
    const courseInfoContainer = document.getElementById("course-info");
    courseInfoContainer.innerHTML = `
        <h2>${courseInfo.course_name}</h2>
        <p>Course ID: ${courseInfo.course_id}</p>
        <p>Other course information can go here...</p>
    `;
}

function getCourseNoteInfo(courseID){//Get note ID and title for the buttons 
    fetch('/getCourseNoteInfo', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseID }) // Send the course ID
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ares is gay ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.noteNames || !data.courseInfo) {
            console.error("Invalid response: ", data);
            return;
        }

        generateButtons(data.noteNames); // Generate buttons for notes
        displayCourseInfo(data.courseInfo); // Display course information

    })
    .catch(error => console.error('Error:', error));
}



