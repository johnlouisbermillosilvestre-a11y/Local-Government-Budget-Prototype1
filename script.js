window.onload = function() {
  console.log("Welcome to the City Government of Paranaque website!");
  updateParanaqueTime();
  setInterval(updateParanaqueTime, 60000); // Update every minute for accuracy
};

async function updateParanaqueTime() {
  try {
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Manila');
    const data = await response.json();
    const paranaqueTime = new Date(data.dateTime);
    const timeString = paranaqueTime.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    document.getElementById("paranaque-time").textContent = `Paranaque City Time: ${timeString}`;
  } catch (error) {
    console.error('Error fetching time:', error);
    // Fallback to local calculation if API fails
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