function toggleMenu() {
  const nav = document.getElementById("navMenu");
  const hamburger = document.getElementById("hamburger");
  nav.classList.toggle("open");
  hamburger.textContent = nav.classList.contains("open") ? "✕" : "☰";
}

// Close menu when a link is clicked
document.querySelectorAll("#navMenu a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("navMenu").classList.remove("open");
    document.getElementById("hamburger").textContent = "☰";
  });
});
