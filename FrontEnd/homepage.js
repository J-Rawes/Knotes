document.addEventListener("DOMContentLoaded", function () {
   let decodedCookie = decodeURIComponent(document.cookie);
   let ca = decodedCookie.split(';');
   username = ca[1];

   document.getElementById("userN").innerHTML = username || "Unknown User";
});
