// Global variables
var notesArr = []; // Array to store user uploaded notes
var filteredNotes = []; // Array for filtered notes
var displayImg = new Image();
const imgCanvas = document.getElementById("imgCanvas");
const txtCanvas = document.getElementById("innerTxt");
const imgCtx = imgCanvas.getContext("2d");
var pairPointer = 0; // Pointer for cycling through image-text pairs
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
      button.onclick = () => displayNote(note.noteID);
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

    // Reset pointer for cycling
    pairPointer = 0;

    // Display the first image and text pair
    displayPair(selectedNote);

    // Show or hide the arrows based on the number of pairs
    const totalPairs = Math.max(
      selectedNote.images ? selectedNote.images.length : 0,
      selectedNote.texts ? selectedNote.texts.length : 0
    );
    document.getElementById("i").style.display = totalPairs > 1 ? "flex" : "none";

    // Show the modal
    document.getElementById("noteModal").style.display = "block";
  }

  // Function to display the current image-text pair
  function displayPair(selectedNote) {
    // Display the current image
    if (selectedNote.images && selectedNote.images.length > pairPointer) {
      displayImg.src = selectedNote.images[pairPointer];
      displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0);
      };
    } else {
      imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height); // Clear canvas if no image
    }

    // Display the current text
    if (selectedNote.texts && selectedNote.texts.length > pairPointer) {
      txtCanvas.innerHTML = selectedNote.texts[pairPointer];
    } else {
      txtCanvas.innerHTML = "No text available for this note.";
    }
  }

  // Function to cycle through image-text pairs
  window.cyclePair = function (forward) {
    const selectedNote = notesArr.find(note => note.noteID === currentNoteID);
    if (!selectedNote) return;

    const totalPairs = Math.max(
      selectedNote.images ? selectedNote.images.length : 0,
      selectedNote.texts ? selectedNote.texts.length : 0
    );

    // Increment or decrement the pointer and wrap around if necessary
    if (forward) {
      pairPointer = (pairPointer + 1) % totalPairs;
    } else {
      pairPointer = (pairPointer - 1 + totalPairs) % totalPairs;
    }

    // Display the new pair
    displayPair(selectedNote);
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