window.onload = function () {

   const courses = getCourses().then(courses => {
       generateButtons(courses); // Change this number to set the default number of buttons 
   })
   .catch(error => console.error('Error:', error));
}

function generateButtons(coursesArr) { 

   console.log(coursesArr);

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

function displayCourse(courseName, courseID) {
   localStorage.setItem("courseName", courseName);
   localStorage.setItem("courseID", courseID);
   window.location.href = `courseDisplay.html`;    
}

async function getCourses() {

   const username = localStorage.getItem("username");
   console.log("Username from localStorage:", username);

   try {
       const response = await fetch('/getLikedCourses', { 
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },

           body: JSON.stringify({username})
       });

       if (!response.ok) {
           throw new Error(`Throw yourself: ${response.status}`);
       }

       const data = await response.json();

       if (!data.courseArr) {
           throw new Error("Throw yourself NOW");
       }

       return data.courseArr;

   } catch (error) {
       console.error("I cant even error right... :(", error); 
       return [];
   }
}