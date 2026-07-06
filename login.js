const form = document.getElementById("loginForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Convert to lowercase right here at the start
  const username = document
    .getElementById("username")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please fill in all fields");
    return;
  }

  // Split username by "/"
  const parts = username.split("/");

  // Must have exactly two parts e.g. "admin/00" or "ismael/03"
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    alert("Invalid username format. Use: name/floor (e.g. ismael/03)");
    return;
  }

  const identifier = parts[1]; // "00" for admin, floor number for users

  if (identifier === "00") {
    // ---- ADMIN LOGIN ----
    const adminPassword = localStorage.getItem("adminPassword") || "admin123";

    if (parts[0] === "admin" && password === adminPassword) {
      localStorage.setItem("loggedInUser", username);
      window.location.href = "admin-dashboard.html";
    } else {
      alert("Invalid admin credentials");
    }
  } else {
    // ---- USER LOGIN ----
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username && u.password === password,
    );

    if (foundUser) {
      localStorage.setItem("loggedInUser", foundUser.username);
      window.location.href = "user-dashboard.html";
    } else {
      alert("Invalid credentials");
    }
  }
});
