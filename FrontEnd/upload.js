const fileInput = document.getElementById("fileUpload")
const imageOutput = document.getElementById("sourceImage");

var imageArray = new Array();
var txtArray = new Array();
var iArrPointer = 0;
var tArrPointer = 0;

var displayImg = new Image;
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("txtCanvas");
const imgCtx = imgCanvas.getContext("2d");

fileInput.addEventListener("change", async () => {
    let [file] = fileInput.files

    const reader = new FileReader();
    reader.onload = (e) => {
      imageOutput.src = e.target.result;
    };

    reader.onerror = (err) => {
        console.error("Error reading file:", err);
        alert("An error occurred while reading the file.");
    };


    reader.readAsDataURL(file);
})

const sourceImage = document.getElementById("sourceImage");
const selectionCanvas = document.getElementById("selectionCanvas");
const croppedCanvas = document.getElementById("croppedCanvas");
const selectionCtx = selectionCanvas.getContext("2d");
const croppedCtx = croppedCanvas.getContext("2d");

let isSelecting = false;
let startX, startY, currentX, currentY;

// Ensure the canvas matches the natural image size
sourceImage.onload = () => {
    selectionCanvas.width = sourceImage.naturalWidth;
    selectionCanvas.height = sourceImage.naturalHeight;
    selectionCtx.drawImage(sourceImage, 0, 0, selectionCanvas.width, selectionCanvas.height);
};

// Get the correct mouse position relative to the canvas
function getMousePos(event) {
    const rect = selectionCanvas.getBoundingClientRect();
    const scaleX = selectionCanvas.width / rect.width;  // Scale factor for X
    const scaleY = selectionCanvas.height / rect.height; // Scale factor for Y

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

// Mouse down event (Start selection)
selectionCanvas.addEventListener("mousedown", (e) => {
    const pos = getMousePos(e);
    isSelecting = true;
    startX = pos.x;
    startY = pos.y;
});

// Mouse move event (Update selection)
selectionCanvas.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;

    const pos = getMousePos(e);
    currentX = pos.x;
    currentY = pos.y;

    // Clear and redraw
    selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    selectionCtx.drawImage(sourceImage, 0, 0, selectionCanvas.width, selectionCanvas.height);

    // Draw selection rectangle
    selectionCtx.beginPath();
    selectionCtx.rect(
        Math.min(startX, currentX),
        Math.min(startY, currentY),
        Math.abs(currentX - startX),
        Math.abs(currentY - startY)
    );
    selectionCtx.strokeStyle = "#f56476";
    selectionCtx.lineWidth = 4;
    selectionCtx.stroke();
});

// Mouse up event (Crop the selected region)
selectionCanvas.addEventListener("mouseup", () => {
    if (!isSelecting) return;
    isSelecting = false;

    // Get selection area
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    if (width === 0 || height === 0) return; // Avoid empty selections

    // Set cropped canvas size
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    // Draw cropped selection
    croppedCtx.drawImage(sourceImage, x, y, width, height, 0, 0, width, height);
   
});

function addScreenshot() {
    const imgButtonPressed = document.getElementById("imgSelect").checked;

    if (imgButtonPressed) {
        const croppedImageDataURL = croppedCanvas.toDataURL();
        imageArray.push(croppedImageDataURL);
    } else {
        // Open the modal window for text editing
        const croppedImageDataURL = croppedCanvas.toDataURL();
        const returnText = sendTextToServer(croppedImageDataURL);
        openModal(returnText);  // Replace this with actual extracted text
    }

    document.getElementById("count").innerHTML = imageArray.length + txtArray.length;
    return false;
}

function addScreenshot2() {
    const imageDataURL = selectionCanvas.toDataURL();
    imageArray.push(imageDataURL);
    document.getElementById("count").innerHTML = imageArray.length + txtArray.length;
    return false;
}

function addScreenshot3() {
    const croppedImageDataURL = croppedCanvas.toDataURL();
    const returnText = sendTextToServer(croppedImageDataURL);
    openModal(returnText);  // Replace this with actual extracted text
    return false;
}

// Open Modal Function
function openModal(defaultText) {
    const modal = document.getElementById("textModal");
    const textInput = document.getElementById("textInput");

    textInput.value = defaultText;  // Set default or extracted text
    modal.style.display = "block";  // Show the modal
}

// Save Text Function
function saveText() {
    const text = document.getElementById("textInput").value.trim();
    if (text) {
        txtArray.push(text);
        console.log("Text saved:", text);
    }
    closeModal('textModal');  // Close after saving
    document.getElementById("count").innerHTML = imageArray.length + txtArray.length;
}

// Close Modal Function
function closeModal(modalType) {
    const modal = document.getElementById(String(modalType));
    modal.style.display = "none";  // Hide the modal
}

//This is where imgArray and textArray will be uploaded to the database
function uploadNote() {
    displayImg.src = imageArray[0];
    displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);
        txtCanvas.innerHTML = txtArray[tArrPointer];
        const modal = document.getElementById("uploadModal");
        modal.style.display = "block";  // Show the modal
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

function sendTextToServer(text) { // Whatever the user inputs
    
    var content;
    
    fetch('/submitText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text})
    })
    .then(response => response.text())
    .then(data => {
        content = data;
    })
    .catch(error => console.error('Error:', error));

    return content;
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
    //txtCtx.clearRect(0, 0, txtCanvas.width, txtCanvas.height);
    //txtCtx.fillText(txtArray[tArrPointer],10,20);
    txtCanvas.innerHTML = txtArray[tArrPointer];
}
