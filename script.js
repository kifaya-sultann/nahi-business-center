document.getElementById("requestForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("reqName").value.trim();
  const email = document.getElementById("reqEmail").value.trim();
  const phone = document.getElementById("reqPhone").value.trim();
  const space = document.getElementById("reqSpace").value.trim();
  const message = document.getElementById("reqMessage").value.trim();

  if (!name || !email || !phone || !space) {
    alert("Please fill in all required fields");
    return;
  }

  // Save to localStorage so admin dashboard can see it
  let requests = JSON.parse(localStorage.getItem("requests")) || [];
  const newId =
    requests.length > 0 ? Math.max(...requests.map((r) => r.id)) + 1 : 1;

  requests.push({
    id: newId,
    name,
    email,
    phone,
    space,
    message,
    date: new Date().toLocaleDateString(),
    status: "Pending",
  });

  localStorage.setItem("requests", JSON.stringify(requests));

  // Show success message
  document.getElementById("successMsg").style.display = "block";
  document.getElementById("requestForm").reset();

  // Hide message after 5 seconds
  setTimeout(() => {
    document.getElementById("successMsg").style.display = "none";
  }, 5000);
});
