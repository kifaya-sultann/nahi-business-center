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
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// Data
let currentUser = null;
let userPayments = [];
let userRequests = [];

// Load on start
window.addEventListener("load", async () => {
  // Check if user is logged in
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("currentUser") || "null");

  if (!token || !userData) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  // Set current user
  currentUser = userData;

  // Load all data from backend
  await loadUserData();
  await loadUserPayments();
  await loadUserRequests();
  await loadSettings();

  // Render everything
  loadMySpace();
  loadMyPayments();
  loadCountdown();
  loadTelegramLink();
  loadMyRequests();
});

// =====================
// LOAD FROM BACKEND
// =====================

async function loadUserData() {
  try {
    const user = await apiRequest("/users/me");
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
  } catch (e) {
    console.error("Failed to load user data:", e);
    alert("Failed to load user data. Please try again.");
  }
}

async function loadUserPayments() {
  try {
    userPayments = await apiRequest("/payments/my");
  } catch (e) {
    console.error("Failed to load payments:", e);
    userPayments = [];
  }
}

async function loadUserRequests() {
  try {
    userRequests = await apiRequest("/service-requests/my");
  } catch (e) {
    console.error("Failed to load service requests:", e);
    userRequests = [];
  }
}

async function loadSettings() {
  try {
    const settings = await apiRequest("/settings");
    if (settings.telegram) {
      document.getElementById("telegramLink").href = settings.telegram;
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
    // Fallback to localStorage
    const telegram = localStorage.getItem("bizTelegram") || "#";
    document.getElementById("telegramLink").href = telegram;
  }
}

// =====================
// MY SPACE (Profile)
// =====================

function loadMySpace() {
  if (!currentUser) return;

  const lastPayment =
    userPayments.length > 0 ? userPayments[userPayments.length - 1] : null;

  document.getElementById("userNextDue").textContent = lastPayment
    ? lastPayment.nextDue
    : "Not set";

  const detailsTable = document.getElementById("userDetailsTable");
  detailsTable.innerHTML = `
    <div class="profile-field">
      <span class="profile-field-label">👤 Username</span>
      <span class="profile-field-value">${currentUser.username || "—"}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">📧 Email</span>
      <span class="profile-field-value">${currentUser.email || "—"}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">📞 Phone</span>
      <span class="profile-field-value">${currentUser.phone || "—"}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">📐 Space</span>
      <span class="profile-field-value">${currentUser.space || "—"} m²</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">📅 Period</span>
      <span class="profile-field-value">${currentUser.period || "—"} month(s)</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">💰 Amount</span>
      <span class="profile-field-value">$${parseFloat(currentUser.amount || 0).toFixed(2)}</span>
    </div>
  `;
}

// =====================
// MY PAYMENTS
// =====================

function loadMyPayments() {
  const table = document.getElementById("userPaymentTable");
  table.innerHTML = "";

  if (userPayments.length === 0) {
    table.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">No payments yet</td></tr>`;
    return;
  }

  [...userPayments].reverse().forEach((p) => {
    table.innerHTML += `
      <tr>
        <td>$${parseFloat(p.amount).toFixed(2)}</td>
        <td>${p.space || "—"} m2</td>
        <td>${p.period || "—"} month(s)</td>
        <td>${p.datePaid || "—"}</td>
        <td>${p.nextDue || "—"}</td>
        <td><span style="color:#22c55e;font-weight:bold;">✅ Paid</span></td>
      </tr>
    `;
  });
}

// =====================
// COUNTDOWN
// =====================

function loadCountdown() {
  const lastPayment =
    userPayments.length > 0 ? userPayments[userPayments.length - 1] : null;
  const timerEl = document.getElementById("countdownTimer");
  const dateEl = document.getElementById("countdownDate");
  const statusEl = document.getElementById("countdownStatus");

  if (!lastPayment || !lastPayment.nextDueRaw) {
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

// =====================
// TELEGRAM LINK
// =====================

function loadTelegramLink() {
  const link = localStorage.getItem("bizTelegram") || "#";
  document.getElementById("telegramLink").href = link;
}

// =====================
// SUBMIT SERVICE REQUEST
// =====================

async function submitRequest() {
  const type = document.getElementById("reqType").value;
  const description = document.getElementById("reqDescription").value.trim();

  if (!type || !description) {
    alert("Please fill all fields");
    return;
  }

  try {
    const result = await apiRequest("/service-requests", {
      method: "POST",
      body: JSON.stringify({ type, description }),
    });

    document.getElementById("reqType").value = "";
    document.getElementById("reqDescription").value = "";
    await loadUserRequests();
    loadMyRequests();
    alert("✅ Request submitted!");
  } catch (e) {
    alert("❌ " + e.message);
  }
}

// =====================
// LOAD MY REQUESTS
// =====================

function loadMyRequests() {
  const table = document.getElementById("myRequestsTable");
  table.innerHTML = "";

  if (userRequests.length === 0) {
    table.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">No requests yet</td></tr>`;
    return;
  }

  [...userRequests].reverse().forEach((r) => {
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
        <td>${r.type || "—"}</td>
        <td>${r.description || "—"}</td>
        <td>${r.date || "—"}</td>
        <td>${statusHTML}</td>
      </tr>
    `;
  });
}

// =====================
// CHANGE PASSWORD
// =====================

async function changePassword() {
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

  try {
    await apiRequest("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: current,
        newPassword: newPass,
      }),
    });

    msg.classList.add("success");
    msg.textContent = "✅ Password updated successfully!";

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  } catch (e) {
    msg.classList.add("error");
    msg.textContent = "❌ " + e.message;
  }
}
