// Global variables
var notesArr = []; // Array to store user uploaded notes
var filteredNotes = []; // Array for filtered notes
var displayImg = new Image();
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("innerTxt");
const imgCtx = imgCanvas.getContext("2d");
var imagePointer = 0; // Pointer for cycling through images
var textPointer = 0; // Pointer for cycling through text
var currentNoteID = null; // Track the currently displayed note

document.addEventListener("DOMContentLoaded", function () {
  // Retrieve the logged-in user identifier (via cookie, token, etc.)
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  let username = ca.length > 1 ? ca[1].trim() : "Guest";

  // Set up event listeners for sort and search
  document.getElementById("sort-button").addEventListener("click", function () {
    const sortOption = document.getElementById("sort-options").value;
    sortNotes(sortOption);
  });

  document.getElementById("search").addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    filterNotes(searchTerm);
  });

  // Fetch the user's uploaded notes on load
  getUserUploadedNotes();

  // Function to generate note buttons
  function generateButtons(notesArr) {
    const container = document.getElementById("button-container");
    container.innerHTML = ""; // Clear existing buttons
  
    notesArr.forEach((note) => {
      let button = document.createElement("button");
      button.className = "note-button";
  
      // Create an element for note title
      let title = document.createElement("h1");
      title.textContent = note.title;
      title.style.margin = "0";
  
      // Create an element for like count
      let likeCount = document.createElement("p");
      likeCount.innerHTML = `&#x2665; ${note.num_likes}`;
      likeCount.style.margin = "0";
      likeCount.style.fontSize = "18px";
  
      button.appendChild(title);
      button.appendChild(likeCount);
  
      // Onclick: display the note's details (images/text)
      button.addEventListener("click", () => displayNote(note.noteID));
  
      container.appendChild(button);
    });
  }

  // Sorting and filtering functions
  function sortNotes(criteria) {
    if (criteria === "title") {
      filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
    } else if (criteria === "likes") {
      filteredNotes.sort((a, b) => b.num_likes - a.num_likes);
    }
    generateButtons(filteredNotes);
  }

  function filterNotes(searchTerm) {
    filteredNotes = notesArr.filter(note => note.title.toLowerCase().includes(searchTerm));
    generateButtons(filteredNotes);
  }

  // Function to display a specific note
  function displayNote(noteID) {
    // Find the specific note by its ID
    const selectedNote = notesArr.find(note => note.noteID === noteID);

    if (!selectedNote) {
      console.error("Note not found!");
      return;
    }

    // Track the current note ID
    currentNoteID = noteID;

    // Reset pointers for cycling
    imagePointer = 0;
    textPointer = 0;

    // Display the first image and text
    displayImage(selectedNote);
    displayText(selectedNote);

    // Show or hide the arrows based on the number of images and texts
    const totalImages = selectedNote.images ? selectedNote.images.length : 0;
    const totalTexts = selectedNote.texts ? selectedNote.texts.length : 0;

    document.getElementById("image-arrows").style.display = totalImages > 1 ? "flex" : "none";
    document.getElementById("text-arrows").style.display = totalTexts > 1 ? "flex" : "none";

    // Show the modal
    document.getElementById("noteModal").style.display = "block";
  }

  // Function to display the current image
  function displayImage(selectedNote) {
    if (selectedNote.images && selectedNote.images.length > imagePointer) {
      displayImg.src = selectedNote.images[imagePointer];
      displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0);
      };
    } else {
      imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height); // Clear canvas if no image
    }
  }

  // Function to display the current text
  function displayText(selectedNote) {
    if (selectedNote.texts && selectedNote.texts.length > textPointer) {
      txtCanvas.innerHTML = selectedNote.texts[textPointer];
    } else {
      txtCanvas.innerHTML = "No text available for this note.";
    }
  }

  // Function to cycle through images
  window.cycleImage = function (forward) {
    const selectedNote = notesArr.find(note => note.noteID === currentNoteID);
    if (!selectedNote || !selectedNote.images) return;

    const totalImages = selectedNote.images.length;

    // Increment or decrement the pointer for images and wrap around if necessary
    if (forward) {
      imagePointer = (imagePointer + 1) % totalImages;
    } else {
      imagePointer = (imagePointer - 1 + totalImages) % totalImages;
    }

    // Display the new image
    displayImage(selectedNote);
  };

  // Function to cycle through text
  window.cycleText = function (forward) {
    const selectedNote = notesArr.find(note => note.noteID === currentNoteID);
    if (!selectedNote || !selectedNote.texts) return;

    const totalTexts = selectedNote.texts.length;

    // Increment or decrement the pointer for texts and wrap around if necessary
    if (forward) {
      textPointer = (textPointer + 1) % totalTexts;
    } else {
      textPointer = (textPointer - 1 + totalTexts) % totalTexts;
    }

    // Display the new text
    displayText(selectedNote);
  };

  // Close modal function
  window.closeModal = function (modalID) {
    document.getElementById(modalID).style.display = "none";
  };

  // Function to fetch the user's uploaded notes from the server
  function getUserUploadedNotes() {
    // For now, use dummy data:
    notesArr = [
      { noteID: 1, title: "My First Note", num_likes: 15, images: ["testIMG.jpg"], texts: ["This is the first note."] },
      { noteID: 2, title: "Vacation Plan", num_likes: 23, images: ["testIMG2.jpg", "testIMG2_alt.jpg"], texts: ["Vacation ideas.", "Packing list."] },
      { noteID: 3, title: "Project Ideas", num_likes: 9, images: ["testIMG3.jpg"], texts: ["Brainstorming project ideas."] }
    ];
    filteredNotes = notesArr.slice();
    generateButtons(filteredNotes);
  }

  // Back link functionality
  document.getElementById("back-link").addEventListener("click", function (event) {
    event.preventDefault();
    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.history.back();
    }
  });
});