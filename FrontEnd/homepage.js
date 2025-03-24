document.getElementById("userN").innerHTML = localStorage.getItem("username");

document.addEventListener("DOMContentLoaded", function () {
   let decodedCookie = decodeURIComponent(document.cookie);
   let ca = decodedCookie.split(';');
   username = ca[1];
}
