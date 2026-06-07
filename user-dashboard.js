// Get logged in user
const loggedInUsername = localStorage.getItem("loggedInUser") || "user";
const users = JSON.parse(localStorage.getItem("users")) || [];
const payments = JSON.parse(localStorage.getItem("payments")) || [];
const telegramLink = localStorage.getItem("bizTelegram") || "#";

const currentUser = users.find((u) => u.username === loggedInUsername);

// Page switching
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.getAttribute("data-page");

    navItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    pages.forEach((page) => {
      page.classList.remove("active");
      if (page.id === target) page.classList.add("active");
    });

    // Update topbar title
    document.getElementById("topbarTitle").textContent =
      item.textContent.trim();
  });
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
});

// Load data on start
window.addEventListener("load", () => {
  if (!currentUser) {
    alert("User not found. Please login again.");
    window.location.href = "login.html";
    return;
  }

  loadUserInfo();
  loadMySpace();
  loadMyPayments();
  loadCountdown();
  loadTelegramLink();
  loadMyRequests();
});

// Load user info in sidebar and topbar
function loadUserInfo() {
  const initial = currentUser.username.charAt(0).toUpperCase();
  document.getElementById("userAvatar").textContent = initial;
  document.getElementById("sidebarUsername").textContent = currentUser.username;
  document.getElementById("topbarUsername").textContent = currentUser.username;
}

// Load My Space
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

  document.getElementById("detailUsername").textContent = currentUser.username;
  document.getElementById("detailEmail").textContent = currentUser.email;
  document.getElementById("detailPhone").textContent = currentUser.phone;
  document.getElementById("detailSpace").textContent =
    currentUser.space + " m2";
  document.getElementById("detailAmount").textContent =
    "$" + currentUser.amount.toFixed(2);
  document.getElementById("detailPeriod").textContent =
    currentUser.period + " month(s)";
}

// Load My Payments
function loadMyPayments() {
  const table = document.getElementById("userPaymentTable");
  table.innerHTML = "";

  const myPayments = payments.filter((p) => p.tenant === currentUser.username);

  if (myPayments.length === 0) {
    table.innerHTML = `<tr><td colspan="6" style="text-align:center;color:rgba(240,250,244,0.4);padding:20px;">No payments yet</td></tr>`;
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

// Load Countdown
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
    timerEl.textContent = diff + " days";
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
    timerEl.style.color = "#f87171";
    statusEl.textContent = "🔴 Please make your payment immediately";
    statusEl.style.color = "#f87171";
  }
}

// Load Telegram Link
function loadTelegramLink() {
  document.getElementById("telegramLink").href = telegramLink;
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
  alert("✅ Request submitted successfully!");
}

// Load My Requests
function loadMyRequests() {
  const myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
  const table = document.getElementById("myRequestsTable");
  table.innerHTML = "";

  const mine = myRequests.filter((r) => r.tenant === currentUser.username);

  if (mine.length === 0) {
    table.innerHTML = `<tr><td colspan="4" style="text-align:center;color:rgba(240,250,244,0.4);padding:20px;">No requests yet</td></tr>`;
    return;
  }

  [...mine].reverse().forEach((r) => {
    let statusHTML = "";
    if (r.status === "Pending") {
      statusHTML = `<span style="color:#facc15;font-weight:bold;">⏳ Pending</span>`;
    } else if (r.status === "In Progress") {
      statusHTML = `<span style="color:#60a5fa;font-weight:bold;">🔄 In Progress</span>`;
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
