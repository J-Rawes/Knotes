window.onload = function () {
    const courses = getCourses().then(courses => {
        generateButtons(courses); // Change this number to set the default number of buttons 
        setupSearchBar(courses);
    })
    .catch(error => console.error('Error:', error));
}

async function getCourses() {
    try {
        const response = await fetch('/getCourseCount', { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Throw yourself: ${response.status}`);
        }

        const data = await response.json();

        if (!data.result) {
            throw new Error("Throw yourself NOW");
        }

        return data.result;

    } catch (error) {
        console.error("I cant even error right... :(", error); 
        return [];
    }
}

function generateButtons(coursesArr) { 
    const container = document.getElementById("button-container");
    container.innerHTML = ""; // Clear existing buttons

    coursesArr.forEach((course, index) => {
        let button = document.createElement("button");
        button.textContent = `${course.course_name}`; // Display course name on the button

        button.onclick = () => displayCourse(course.course_name, course.course_id);

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
    const filteredCourses = courses.filter(course => course.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
    generateButtons(filteredCourses);
}

function displayCourse(courseName, courseID) {
    localStorage.setItem("courseName", courseName);
    localStorage.setItem("courseID", courseID);
    window.location.href = `courseDisplay.html`;    
}
