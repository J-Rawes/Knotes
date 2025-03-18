window.onload = function () {
     const courses = getCourses().then(courses => {
        generateButtons(courses); // Change this number to set the default number of buttons 
        setupSearchBar(courses);
     })
     .catch(error => console.error('Error:', error));
 }
 
function getCourses() {
    
    fetch('/getCourseCount', { 
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
      
    })
    .then(response => {
        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if(!data.courseNames){
            console.error("Invalid response: ", data);
            return;
        }
        
       return data.courseNames; 
       
    })
    .catch(error => console.error('Error:', error));
  };


  function generateButtons(coursesArr) { 
    const container = document.getElementById("button-container");
    container.innerHTML = ""; // Clear existing buttons

        coursesArr.forEach((course, index) => {
        let button = document.createElement("button");
        button.textContent = `Course: ${Course}`; // Display note ID on the button

        // CHANGE THIS TO COURSE
        button.onclick = () => displayCourse(course);

        // Append button to container
        container.appendChild(button);
    });
}

function setupSearchBar(courses) {
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', function() {
        dynamicUpdateOnType(courses, searchInput.value);
    });
}

function dynamicUpdateOnType(courses, searchTerm) {
    const filteredCourses = courses.filter(course => course.toLowerCase().includes(searchTerm.toLowerCase()));
    generateButtons(filteredCourses);
}

function displayCourse(courseName) {
    window.location.href = `courseDisplay.html?courseName=${encodeURIComponent(courseName)}`;
}