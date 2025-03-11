//const client = require('./server.js');

/*\
1. onload, ask DB for number of uploaded notes and relevant info such as note author
2. Make x amout of buttons on HTML site based on number of notes
3. Display note info on each button
4. On click, open modal and fill it with text and images of that note
*/


//DISCLAMER!!! THIS CODE STILL NEEDS A WAY TO RECIEVE THE COURSE ID, NOT SURE HOW IT WILL BE SET UP ON THE HOME PAGE

var imageArray = new Array();
var txtArray = new Array();
var displayImg = new Image;
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("txtCanvas");
const imgCtx = imgCanvas.getContext("2d");
const txtCtx = txtCanvas.getContext("2d");
txtCtx.font = "24px Verdana, sans-serif"
var iArrPointer = 0;
var tArrPointer = 0;


window.onload = function () {
   // const noteIDs = new Array;
   const noteIDs = [1,2,3,4,5,6];
    loadArrayTest();
    loadTArrayTest();

    ///*step 1*/getNoteCountAndID(123); // Returns both a count of how many notes are for this course and their respective names/IDs
    /*step 2*/generateButtons(noteIDs); // Change this number to set the default number of buttons 
}

function generateButtons(notesArr) { 
    const container = document.getElementById("button-container");
    container.innerHTML = ""; // Clear existing buttons

    /*step 3*/ notesArr.forEach((noteID, index) => {
        let button = document.createElement("button");
        button.textContent = `Note ${noteID}`; // Display note ID on the button

        // Set onclick event to display note
         /*step 4*/button.onclick = () => displayNote(noteID);

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
        txtCtx.fillText(txtArray[tArrPointer],10,20);
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
    txtCtx.clearRect(0, 0, txtCanvas.width, txtCanvas.height);
    txtCtx.fillText(txtArray[tArrPointer],10,20);
}

function getNoteCountAndID(CID){//Get note ID and title for the buttons 
    fetch('/getNoteCountAndID', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({courseID : CID}) //send the course id
    })
    .then(response => {
        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
})
    .then(data => {
        if(!data.noteIDs){
            console.error("Invalid response: ", data);
            return;
        }
        
        noteIDs = data.noteIDs; //Response back from server, only thing thats really important here

    })
    .catch(error => console.error('Error:', error));
}



