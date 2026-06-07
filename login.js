const form = document.getElementById("loginForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  // Basic validation
  if (!username || !password || !role) {
    alert("Please fill in all fields");
    return;
  }

  // Hardcoded credentials
  const admin = {
    username: "admin",
    password: localStorage.getItem("adminPassword") || "admin123",
  };
  const user = {
    username: "user",
    password: localStorage.getItem("userPassword") || "user123",
  };

  if (role === "admin") {
    if (username === admin.username && password === admin.password) {
      window.location.href = "admin-dashboard.html";
    } else {
      alert("Invalid admin credentials");
    }
  } else if (role === "user") {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const foundUser = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (foundUser) {
      localStorage.setItem("loggedInUser", foundUser.username);
      window.location.href = "user-dashboard.html";
    } else {
      alert("Invalid user credentials");
    }
  }
});
