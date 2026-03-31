window.onload = function() {
  console.log("Welcome to the City Government of Paranaque website!");
  updateParanaqueTime();
  setInterval(updateParanaqueTime, 1000);
};

function updateParanaqueTime() {
  const now = new Date();
  const paranaqueTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const timeString = paranaqueTime.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  document.getElementById("paranaque-time").textContent = `Paranaque City Time: ${timeString}`;
}

document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", function(event) {
    event.preventDefault();
    const section = this.getAttribute("href").substring(1);
    document.getElementById(section).scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelector(".city-image").addEventListener("click", function() {
  alert("You clicked on the Paranaque City image!");
});