const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = form.querySelector("button[type='submit']");

  // Disable button and show loading
  btn.disabled = true;
  btn.textContent = "Logging in...";

  const username = document
    .getElementById("username")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please fill in all fields");
    btn.disabled = false;
    btn.textContent = "Login";
    return;
  }

  // Split username by "/"
  const parts = username.split("/");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    alert("Invalid username format. Use: name/floor (e.g. ismael/03)");
    btn.disabled = false;
    btn.textContent = "Login";
    return;
  }

  const identifier = parts[1];
  const role = identifier === "00" ? "admin" : "user";

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: role === "admin" ? parts[0] : username,
        password,
        role,
      }),
    });

    // Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("loggedInUser", data.user.username);
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    btn.textContent = "Redirecting...";

    // Redirect based on role
    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "user-dashboard.html";
    }
  } catch (error) {
    alert("❌ " + error.message);
    btn.disabled = false;
    btn.textContent = "Login";
  }
});
