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
  // Set up event listeners for sort and search
  document.getElementById("sort-button").addEventListener("click", function () {
    const sortOption = document.getElementById("sort-options").value;
    sortNotes(sortOption);
  });

  document.getElementById("search").addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    filterNotes(searchTerm);
  });

  // Fetch the user's uploaded notes on load and generate buttons
  getUserUploadedNotes().then(notes => {
    notesArr = notes;
    filteredNotes = notes.slice();
    generateButtons(filteredNotes);
  });

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
      button.addEventListener("click", () => displayNote(note.title, note.note_id));
  
      // Add a delete button for each note
      let deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete-button";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent triggering the displayNote function
        deleteNote(note.note_id);
      });

      button.appendChild(deleteButton);
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

  function displayImage(selectedNote) {
    if (selectedNote.images && selectedNote.images.length > imagePointer) {
      displayImg.src = selectedNote.images[imagePointer];
      displayImg.onload = () => {
        imgCanvas.width = displayImg.naturalWidth;
        imgCanvas.height = displayImg.naturalHeight;
        imgCtx.drawImage(displayImg, 0, 0);
      };
    } else {
      imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
    }
  }

  function displayText(selectedNote) {
    if (selectedNote.texts && selectedNote.texts.length > textPointer) {
      txtCanvas.innerHTML = selectedNote.texts[textPointer];
    } else {
      txtCanvas.innerHTML = "No text available for this note.";
    }
  }

  // Function to fetch the user's uploaded notes from the server
  async function getUserUploadedNotes() {
    const username = localStorage.getItem("username");
  
    try {
      const response = await fetch('/getUserUploadedNotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const text = await response.text();
      console.log("Raw response:", text);
      
      let data;
      try {
        data = JSON.parse(text);
        console.log("Parsed notes:", data);
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        return [];
      }
  
      return data.notes || [];
  
    } catch (error) {
      console.error("Error fetching user's notes:", error);
      return [];
    }
  }

  // Function to delete a note
  async function deleteNote(noteID) {
    try {
      const response = await fetch('/deleteNote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteID })
      });

      const data = await response.json();
      if (data.success) {
        alert("Note deleted successfully!");
        // Redirect to the homepage after successful deletion
        window.location.href = "homepage.html";
      } else {
        console.error("Failed to delete note:", data.message);
        alert("Failed to delete note.");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error deleting note.");
    }
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

function getNoteID() {
  return this.currentNoteID;
}

function displayNote(noteName, noteID) {
  localStorage.setItem("noteName", noteName);
  localStorage.setItem("noteID", noteID);
  window.location.href = `userNoteDisplay.html`;
}