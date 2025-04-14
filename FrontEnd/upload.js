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
var imgOriginal;

let isSelecting = false;
let startX, startY, currentX, currentY;

// Ensure the canvas matches the natural image size
sourceImage.onload = () => {
    selectionCanvas.width = sourceImage.naturalWidth;
    selectionCanvas.height = sourceImage.naturalHeight;
    selectionCtx.drawImage(sourceImage, 0, 0, selectionCanvas.width, selectionCanvas.height);
    imgOriginal = selectionCanvas.toDataURL();
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

async function addScreenshot(event) {
    event.preventDefault();
    const imgButtonPressed = document.getElementById("imgSelect").checked;

    if (imgButtonPressed) {
        const croppedImageDataURL = croppedCanvas.toDataURL("image/jpeg", 0.6); // reduce quality/size
        imageArray.push(croppedImageDataURL);
    } else {
        // Open the modal window for text editing
        const croppedImageDataURL = croppedCanvas.toDataURL("image/jpeg", 0.6); // reduce quality/size
        const returnText = await sendTextToServer(croppedImageDataURL);
        if (returnText) {
            openModal(returnText.extractedText);  // Replace this with actual extracted text
        } else {
            console.error('Failed to get text from server');
        }
    }

    document.getElementById("count").innerHTML = imageArray.length + txtArray.length;
    return false;
}

function addScreenshot2() {
    const imageDataURL = selectionCanvas.toDataURL("image/jpeg", 0.6);
    imageArray.push(imageDataURL);
    document.getElementById("count").innerHTML = imageArray.length + txtArray.length;
    return false;
}

async function addScreenshot3() {
    const croppedImageDataURL = selectionCanvas.toDataURL("image/jpeg", 0.6);
    const returnText = await sendTextToServer(croppedImageDataURL);
    if (returnText) {
        openModal(returnText.extractedText);  
    } else {
        console.error('Failed to get text from server');
    }
    return false;
}

// Open Modal Function
function openModal(defaultText) {
    const modal = document.getElementById("textModal");
    const textInput = document.getElementById("textInput");

    if (typeof defaultText !== 'string') {
        console.error("openModal received non-string:", defaultText);
        defaultText = "No text extracted.";
    }

    defaultText = defaultText.replace(/[\n\r]+/g, ' ');

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
    if (txtArray.length > 1) {
        document.getElementById("t").style.display = "block";
    } else {
        document.getElementById("t").style.display = "none";
    }
    if (imageArray.length > 0) {
        // Load the first image
        displayImg.src = imageArray[0];
        imgCanvas.style.display = "block"; // Hide the canvas if no images are available
        if (imageArray.length > 1) {
            document.getElementById("i").style.display = "block";
        } else {
            document.getElementById("i").style.display = "none";
        }
        displayImg.onload = () => {
            drawCanvasWithBadge(); // Draw the canvas with the badge after the image is loaded
        };
        if (txtArray.length > 0) {
            txtCanvas.style.display = "block";
            drawTextCanvasWithBadge();
            if (txtArray.length > 1) {document.getElementById("t").style.display = "block";}
        }
        // Show the modal after ensuring the canvas is updated
        const modal = document.getElementById("uploadModal");
        modal.style.display = "block";
    } 
    else {
        imgCanvas.style.display = "none"; // Hide the canvas if no images are available
        document.getElementById("i").style.display = "none";
        if (txtArray.length > 0) {
            txtCanvas.style.display = "block";
            drawTextCanvasWithBadge();
            if (txtArray.length > 1) {document.getElementById("t").style.display = "block";}
        } else {
            txtCanvas.style.display = "none"; // Hide the canvas if no text is available
            document.getElementById("t").style.display = "none";
        }
        const modal = document.getElementById("uploadModal");
        modal.style.display = "block";
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

async function sendTextToServer(text) { // Whatever the user inputs
    try {
        const response = await fetch('/submitText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: text })
        });

        const data = await response.json();
        console.log("Server response:", data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
  }

  function nextImg(forward) {
    if (forward) {
        if (iArrPointer === imageArray.length - 1) {
            iArrPointer = 0; // Loop back to the first image
        } else {
            iArrPointer += 1; // Move to the next image
        }
    } else {
        if (iArrPointer === 0) {
            iArrPointer = imageArray.length - 1; // Loop back to the last image
        } else {
            iArrPointer -= 1; // Move to the previous image
        }
    }

    // Load the new image and redraw the canvas with the badge
    displayImg.src = imageArray[iArrPointer];
    displayImg.onload = () => {
        drawCanvasWithBadge(); // Redraw the canvas with the badge
    };
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
    drawTextCanvasWithBadge();
}

function drawTrashBadge() {
    const badgeSize = 30; // Fixed size of the badge in pixels
    const badgePadding = 10; // Padding from the top-right corner in pixels

    // Get the canvas's bounding rectangle to calculate scaling
    const rect = imgCanvas.getBoundingClientRect();
    const scaleX = imgCanvas.width / rect.width; // Scale factor for X
    const scaleY = imgCanvas.height / rect.height; // Scale factor for Y

    // Calculate the badge's position on the canvas
    const badgeX = imgCanvas.width - (badgePadding * scaleX) - (badgeSize * scaleX) / 2;
    const badgeY = (badgePadding * scaleY) + (badgeSize * scaleY) / 2;

    // Draw the trash badge
    imgCtx.fillStyle = "red"; // Badge background color
    imgCtx.beginPath();
    imgCtx.arc(
        badgeX, // X position
        badgeY, // Y position
        (badgeSize / 2) * scaleX, // Radius scaled to canvas
        0,
        2 * Math.PI
    );
    imgCtx.fill();

    // Draw the trash icon (🗑️)
    imgCtx.fillStyle = "white"; // Icon color
    imgCtx.font = `${(badgeSize - 10) * scaleX}px Arial`; // Font size scaled to canvas
    imgCtx.textAlign = "center";
    imgCtx.textBaseline = "middle";
    imgCtx.fillText("🗑️", badgeX, badgeY);
}

function deleteImage() {
    console.log("made it");
    // Check if imageArray exists and has images
    if (imageArray.length > 0) {
        // Remove the current image by creating a new array
        const newArray = imageArray.filter((_, index) => index !== iArrPointer);

        // Reassign the original array to the new array
        while (imageArray.length > 0) {
            imageArray.pop(); // Clear the original array
        }
        imageArray.push(...newArray); // Push the new array elements into the original array
        document.getElementById("count").innerHTML = imageArray.length + txtArray.length;

        // Adjust the pointer to stay within bounds
        if (iArrPointer >= imageArray.length) {
            iArrPointer = 0; // Reset to the first image if the pointer exceeds the array length
        }

        // If there are more images, display the next one
        if (imageArray.length > 0) {
            displayImg.src = imageArray[iArrPointer];
            displayImg.onload = () => {
                drawCanvasWithBadge(); // Redraw the canvas with the badge
            };

            if (imageArray.length > 1) {
                document.getElementById("i").style.display = "block";
            } else {
                document.getElementById("i").style.display = "none";
            }
        } else {
            // If no images are left, clear the canvas
            imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
            imgCanvas.width = 0; // Reset canvas width
            imgCanvas.height = 0; // Reset canvas height
            imgCanvas.style.display = "none"; // Hide the canvas if no images are available
        }
    } else {
        alert("No images to delete.");
    }
}

function drawCanvasWithBadge() {
    // Set canvas dimensions to match the image
    imgCanvas.width = displayImg.naturalWidth;
    imgCanvas.height = displayImg.naturalHeight;

    // Draw the image on the canvas
    imgCtx.drawImage(displayImg, 0, 0, imgCanvas.width, imgCanvas.height);

    // Draw the trash badge
    drawTrashBadge();
}

// Add a click event listener to detect clicks on the trash badge
imgCanvas.addEventListener("click", (event) => {
    const rect = imgCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left; // X position of the click
    const y = event.clientY - rect.top; // Y position of the click

    const badgeSize = 30; // Fixed size of the badge in pixels
    const badgePadding = 10; // Padding from the top-right corner in pixels

    // Get the canvas's bounding rectangle to calculate scaling
    const scaleX = imgCanvas.width / rect.width; // Scale factor for X
    const scaleY = imgCanvas.height / rect.height; // Scale factor for Y

    // Calculate the badge's position relative to the canvas
    const badgeX = imgCanvas.width - (badgePadding * scaleX) - (badgeSize * scaleX) / 2;
    const badgeY = (badgePadding * scaleY) + (badgeSize * scaleY) / 2;

    // Check if the click is inside the badge
    const distance = Math.sqrt((x * scaleX - badgeX) ** 2 + (y * scaleY - badgeY) ** 2);
    if (distance <= (badgeSize / 2) * scaleX) {
        console.log("Trash badge clicked");
        deleteImage(); // Call the deleteImage function
    } else {
        console.log("Canvas clicked outside the trash badge");
    }
});

function drawTextTrashBadge() {
    const badgeSize = 30; // Size of the trash badge in pixels
    const badgePadding = 10; // Padding from the top-right corner in pixels

    // Create the trash badge element
    let trashBadge = document.getElementById("textTrashBadge");
    if (!trashBadge) {
        trashBadge = document.createElement("div");
        trashBadge.id = "textTrashBadge";
        trashBadge.style.position = "absolute";
        trashBadge.style.width = `${badgeSize}px`;
        trashBadge.style.height = `${badgeSize}px`;
        trashBadge.style.backgroundColor = "red";
        trashBadge.style.borderRadius = "50%";
        trashBadge.style.display = "flex";
        trashBadge.style.justifyContent = "center";
        trashBadge.style.alignItems = "center";
        trashBadge.style.color = "white";
        trashBadge.style.fontSize = `${badgeSize - 10}px`;
        trashBadge.style.cursor = "pointer";
        trashBadge.innerText = "🗑️";

        // Add click event listener to delete text
        trashBadge.addEventListener("click", () => {
            deleteText();
        });

        // Append the badge to the txtCanvas (div)
        txtCanvas.appendChild(trashBadge);
    }

    // Position the trash badge in the top-right corner of the txtCanvas
    trashBadge.style.top = `${badgePadding}px`;
    trashBadge.style.right = `${badgePadding}px`;
}

function deleteText() {
    // Check if txtArray exists and has text entries
    if (txtArray.length > 0) {
        // Remove the current text
        txtArray.splice(tArrPointer, 1);

        // Adjust the pointer
        if (tArrPointer >= txtArray.length) {
            tArrPointer = 0; // Reset to the first text if the pointer exceeds the array length
        }

        // Update the text in the txtCanvas
        if (txtArray.length > 0) {
            txtCanvas.innerText = txtArray[tArrPointer];
            drawTextCanvasWithBadge();

            if (txtArray.length > 1) {
                document.getElementById("t").style.display = "block"; // Show the text badge if more than one text entry remains
            } else {    
                document.getElementById("t").style.display = "none"; // Hide the text badge if only one text entry remains
            }

        } else {
            txtCanvas.style.display = "none"; // Hide the canvas if no text is available
        }

        // Update the count display
        document.getElementById("count").innerHTML = imageArray.length + txtArray.length;
    } else {
        alert("No text entries to delete.");
    }
}

function drawTextCanvasWithBadge() {
    // Clear the div
    txtCanvas.innerText = "";

    // Display the current text
    txtCanvas.innerText = txtArray[tArrPointer] || "No text available";

    // Draw the trash badge
    drawTextTrashBadge();
}

// Add a click event listener to detect clicks on the trash badge for txtCanvas
txtCanvas.addEventListener("click", (event) => {
    const rect = txtCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left; // X position of the click
    const y = event.clientY - rect.top; // Y position of the click

    const badgeSize = 30; // Fixed size of the badge in pixels
    const badgePadding = 10; // Padding from the top-right corner in pixels

    // Get the canvas's bounding rectangle to calculate scaling
    const scaleX = txtCanvas.width / rect.width; // Scale factor for X
    const scaleY = txtCanvas.height / rect.height; // Scale factor for Y

    // Calculate the badge's position relative to the canvas
    const badgeX = txtCanvas.width - (badgePadding * scaleX) - (badgeSize * scaleX) / 2;
    const badgeY = (badgePadding * scaleY) + (badgeSize * scaleY) / 2;

    // Check if the click is inside the badge
    const distance = Math.sqrt((x * scaleX - badgeX) ** 2 + (y * scaleY - badgeY) ** 2);
    if (distance <= (badgeSize / 2) * scaleX) {
        console.log("Text trash badge clicked");
        deleteText(); // Call the deleteText function
    } else {
        console.log("Text canvas clicked outside the trash badge");
    }
});

confirmUpload = async () => {
    const courseName = document.getElementById("course").value;
    console.log("The course name is: " + courseName);
    const noteTitle = document.getElementById("title").value;
    console.log("The Note title is: " + noteTitle);
    const conditions = ["\\", "<", ">", "|", "/", "=", "&", "#"];

    // Validation checks
    if (courseName.length > 50) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerHTML = "Course name cannot exceed 50 characters.";
        return;
    } else if (conditions.some(el => courseName.includes(el))) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerHTML = "Course name cannot contain special characters: /\\|<>=&#";
        return;
    } else if (noteTitle.length > 100) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerHTML = "Note title cannot exceed 100 characters.";
        return;
    } else if (conditions.some(el => noteTitle.includes(el))) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerHTML = "Note title cannot contain special characters: /\\|<>=&#";
        return;
    } else if (courseName.length === 0 || noteTitle.length === 0) {
        document.getElementById("message").style.color = "#f56476";
        document.getElementById("message").innerHTML = "Please fill in all fields.";
        return;
    }

    const username = localStorage.getItem("username");

    // Data to send to the server
    // const data = {
    //     course: courseName,
    //     title: noteTitle,
    //     imageArray: imageArray,
    //     txtArray: txtArray,
    //     username: username
    // };

    //console.log("Data to be sent:", data);

    try {
        const response = await fetch('/uploadNote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({course: courseName, title: noteTitle, imageArray: imageArray, txtArray: txtArray, username: username })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Server response:", responseData);
        alert("Note uploaded successfully!");
        window.location.replace("/");
    } catch (error) {
        console.error('Error:', error);
        alert("Failed to upload note. Please try again.");
    }
};
