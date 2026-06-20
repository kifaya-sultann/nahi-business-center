// Page switching
const links = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

links.forEach((link) => {
  link.addEventListener("click", () => {
    const target = link.getAttribute("data-page");
    links.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    pages.forEach((page) => {
      page.classList.remove("active");
      if (page.id === target) page.classList.add("active");
    });
  });
});

// Logout
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
});

// Data
const loggedInUsername = localStorage.getItem("loggedInUser") || "user";
const users = JSON.parse(localStorage.getItem("users")) || [];
const payments = JSON.parse(localStorage.getItem("payments")) || [];
const currentUser = users.find((u) => u.username === loggedInUsername);

// Load on start
window.addEventListener("load", () => {
  if (!currentUser) {
    alert("User not found. Please login again.");
    window.location.href = "login.html";
    return;
  }
  loadMySpace();
  loadMyPayments();
  loadCountdown();
  loadTelegramLink();
  loadMyRequests();
});

// My Space
function loadMySpace() {
  const lastPayment = payments
    .filter((p) => p.tenant === currentUser.username)
    .pop();

  document.getElementById("userSpace").textContent = currentUser.space + " m2";
  document.getElementById("userAmount").textContent =
    "$" + currentUser.amount.toFixed(2);
  document.getElementById("userPeriod").textContent =
    currentUser.period + " month(s)";
  document.getElementById("userNextDue").textContent = lastPayment
    ? lastPayment.nextDue
    : "Not set";

  const detailsTable = document.getElementById("userDetailsTable");
  detailsTable.innerHTML = `
    <tr><td><strong>Username</strong></td><td>${currentUser.username}</td></tr>
    <tr><td><strong>Email</strong></td><td>${currentUser.email}</td></tr>
    <tr><td><strong>Phone</strong></td><td>${currentUser.phone}</td></tr>
    <tr><td><strong>Space</strong></td><td>${currentUser.space} m2</td></tr>
    <tr><td><strong>Amount</strong></td><td>$${currentUser.amount.toFixed(2)}</td></tr>
    <tr><td><strong>Period</strong></td><td>${currentUser.period} month(s)</td></tr>
  `;
}

// My Payments
function loadMyPayments() {
  const table = document.getElementById("userPaymentTable");
  table.innerHTML = "";
  const myPayments = payments.filter((p) => p.tenant === currentUser.username);

  if (myPayments.length === 0) {
    table.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">No payments yet</td></tr>`;
    return;
  }

  [...myPayments].reverse().forEach((p) => {
    table.innerHTML += `
      <tr>
        <td>$${p.amount.toFixed(2)}</td>
        <td>${p.space} m2</td>
        <td>${p.period} month(s)</td>
        <td>${p.datePaid}</td>
        <td>${p.nextDue}</td>
        <td><span style="color:#22c55e;font-weight:bold;">✅ Paid</span></td>
      </tr>
    `;
  });
}

// Countdown
function loadCountdown() {
  const lastPayment = payments
    .filter((p) => p.tenant === currentUser.username)
    .pop();
  const timerEl = document.getElementById("countdownTimer");
  const dateEl = document.getElementById("countdownDate");
  const statusEl = document.getElementById("countdownStatus");

  if (!lastPayment) {
    timerEl.textContent = "—";
    dateEl.textContent = "No payment recorded yet";
    statusEl.textContent = "";
    return;
  }

  const nextDue = new Date(lastPayment.nextDueRaw);
  const today = new Date();
  const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));

  dateEl.textContent = "Due on: " + lastPayment.nextDue;

  if (diff > 0) {
    timerEl.textContent = diff + " days left";
    timerEl.style.color = "#22c55e";
    statusEl.textContent = "✅ You're up to date!";
    statusEl.style.color = "#22c55e";
  } else if (diff === 0) {
    timerEl.textContent = "Due Today!";
    timerEl.style.color = "#f97316";
    statusEl.textContent = "⚠️ Please make your payment today";
    statusEl.style.color = "#f97316";
  } else {
    timerEl.textContent = Math.abs(diff) + " days overdue";
    timerEl.style.color = "#e53e3e";
    statusEl.textContent = "🔴 Please make your payment immediately";
    statusEl.style.color = "#e53e3e";
  }
}

// Telegram Link
function loadTelegramLink() {
  const link = localStorage.getItem("bizTelegram") || "#";
  document.getElementById("telegramLink").href = link;
}

// Submit Request
function submitRequest() {
  const type = document.getElementById("reqType").value;
  const description = document.getElementById("reqDescription").value.trim();

  if (!type || !description) {
    alert("Please fill all fields");
    return;
  }

  let myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
  const newId =
    myRequests.length > 0 ? Math.max(...myRequests.map((r) => r.id)) + 1 : 1;

  myRequests.push({
    id: newId,
    tenant: currentUser.username,
    type,
    description,
    date: new Date().toLocaleDateString(),
    status: "Pending",
  });

  localStorage.setItem("myRequests", JSON.stringify(myRequests));
  document.getElementById("reqType").value = "";
  document.getElementById("reqDescription").value = "";
  loadMyRequests();
  alert("✅ Request submitted!");
}

// Load My Requests
function loadMyRequests() {
  const myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
  const table = document.getElementById("myRequestsTable");
  table.innerHTML = "";
  const mine = myRequests.filter((r) => r.tenant === currentUser.username);

  if (mine.length === 0) {
    table.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">No requests yet</td></tr>`;
    return;
  }

  [...mine].reverse().forEach((r) => {
    let statusHTML = "";
    if (r.status === "Pending") {
      statusHTML = `<span style="color:#d97706;font-weight:bold;">⏳ Pending</span>`;
    } else if (r.status === "In Progress") {
      statusHTML = `<span style="color:#3b82f6;font-weight:bold;">🔄 In Progress</span>`;
    } else {
      statusHTML = `<span style="color:#22c55e;font-weight:bold;">✅ Done</span>`;
    }
    table.innerHTML += `
      <tr>
        <td>${r.type}</td>
        <td>${r.description}</td>
        <td>${r.date}</td>
        <td>${statusHTML}</td>
      </tr>
    `;
  });
}

// =====================
// Settings - Change Password
// =====================
function changePassword() {
  const current = document.getElementById("currentPassword").value.trim();
  const newPass = document.getElementById("newPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("passwordMsg");

  msg.className = "password-msg";
  msg.textContent = "";

  if (!current || !newPass || !confirm) {
    msg.classList.add("error");
    msg.textContent = "⚠️ Please fill in all fields.";
    return;
  }
  if (newPass.length < 6) {
    msg.classList.add("error");
    msg.textContent = "⚠️ New password must be at least 6 characters.";
    return;
  }
  if (newPass !== confirm) {
    msg.classList.add("error");
    msg.textContent = "⚠️ New passwords do not match.";
    return;
  }

  // Check against localStorage
  const allUsers = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = allUsers.findIndex((u) => u.username === loggedInUsername);

  if (userIndex === -1) {
    msg.classList.add("error");
    msg.textContent = "❌ User not found.";
    return;
  }

  if (allUsers[userIndex].password !== current) {
    msg.classList.add("error");
    msg.textContent = "❌ Current password is incorrect.";
    return;
  }

  // Save new password
  allUsers[userIndex].password = newPass;
  localStorage.setItem("users", JSON.stringify(allUsers));

  msg.classList.add("success");
  msg.textContent = "✅ Password updated successfully!";

  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
}
