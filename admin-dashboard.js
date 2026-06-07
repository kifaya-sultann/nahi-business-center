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
  window.location.href = "login.html";
});

// Data
// Data
let users = JSON.parse(localStorage.getItem("users")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];
let requests = JSON.parse(localStorage.getItem("requests")) || [];
let pricePerM2 = parseFloat(localStorage.getItem("pricePerM2")) || 10;
let rejectTargetId = null;

// Load on start
window.addEventListener("load", () => {
  document.getElementById("pricePerM2").value = pricePerM2;

  // Load saved business info
  document.getElementById("settingsPhone").value =
    localStorage.getItem("bizPhone") || "";
  document.getElementById("settingsEmail").value =
    localStorage.getItem("bizEmail") || "";
  document.getElementById("settingsTelegram").value =
    localStorage.getItem("bizTelegram") || "";

  updateDashboard();
  renderUsers();
  renderPayments();
  renderRequests();
});

// Auto calculate amount when space or period changes
document.getElementById("space").addEventListener("input", calcAmount);
document.getElementById("period").addEventListener("change", calcAmount);

function calcAmount() {
  const space = parseFloat(document.getElementById("space").value) || 0;
  const period = parseFloat(document.getElementById("period").value) || 0;
  const amount = space * pricePerM2 * period;
  document.getElementById("amount").value =
    amount > 0 ? "$" + amount.toFixed(2) : "";
}

// Save Price Settings
function saveSettings() {
  const val = parseFloat(document.getElementById("pricePerM2").value);
  if (!val || val <= 0) {
    alert("Please enter a valid price");
    return;
  }
  pricePerM2 = val;
  localStorage.setItem("pricePerM2", pricePerM2);
  showMsg("settingsMsg", "✅ Price saved: $" + pricePerM2 + " per m2", "green");
}

// Save Business Info
function saveBusinessInfo() {
  const phone    = document.getElementById("settingsPhone").value.trim();
  const email    = document.getElementById("settingsEmail").value.trim();
  const telegram = document.getElementById("settingsTelegram").value.trim();

  if (!phone || !email || !telegram) {
    alert("Please fill all fields");
    return;
  }

  localStorage.setItem("bizPhone", phone);
  localStorage.setItem("bizEmail", email);
  localStorage.setItem("bizTelegram", telegram);
  showMsg("businessInfoMsg", "✅ Business info saved!", "green");
}

// Change Admin Password
function changePassword() {
  const current = document.getElementById("currentPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  const savedPassword = localStorage.getItem("adminPassword") || "admin123";

  if (current !== savedPassword) {
    showMsg("passwordMsg", "❌ Current password is incorrect", "red");
    return;
  }
  if (!newPass || newPass.length < 4) {
    showMsg("passwordMsg", "❌ New password must be at least 4 characters", "red");
    return;
  }
  if (newPass !== confirm) {
    showMsg("passwordMsg", "❌ Passwords do not match", "red");
    return;
  }

  localStorage.setItem("adminPassword", newPass);
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  showMsg("passwordMsg", "✅ Password changed successfully!", "green");
}

// Helper: show message then hide
function showMsg(id, text, color) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = color === "green" ? "#22c55e" : "#e53e3e";
  setTimeout(() => el.textContent = "", 3000);
}

// Save User (Add or Edit)
function saveUser() {
  const id = document.getElementById("userId").value;
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const space = parseFloat(document.getElementById("space").value);
  const period = parseInt(document.getElementById("period").value);

  if (!username || !email || !phone || !password || !space || !period) {
    alert("Please fill all fields");
    return;
  }

  const amount = space * pricePerM2 * period;

  if (id) {
    const index = users.findIndex((u) => u.id == id);
    users[index] = {
      ...users[index],
      username,
      email,
      phone,
      password,
      space,
      period,
      amount,
    };
  } else {
    const newId =
      users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    users.push({
      id: newId,
      username,
      email,
      phone,
      password,
      space,
      period,
      amount,
    });
  }

  localStorage.setItem("users", JSON.stringify(users));
  clearForm();
  renderUsers();
  updateDashboard();
}

// Render Users Table
function renderUsers() {
  const table = document.getElementById("userTable");
  table.innerHTML = "";

  users.forEach((user) => {
    const lastPayment = payments
      .filter((p) => p.tenant === user.username)
      .pop();
    let countdownHTML = '<span style="color:#999">No payment yet</span>';

    if (lastPayment) {
      const nextDue = new Date(lastPayment.nextDueRaw);
      const today = new Date();
      const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));

      if (diff > 0) {
        countdownHTML = `<span style="color:#22c55e;font-weight:bold">⏳ ${diff} days left</span>`;
      } else if (diff === 0) {
        countdownHTML = `<span style="color:#f97316;font-weight:bold">⚠️ Due Today!</span>`;
      } else {
        countdownHTML = `<span style="color:#e53e3e;font-weight:bold">🔴 Overdue by ${Math.abs(diff)} days</span>`;
      }
    }

    table.innerHTML += `
      <tr>
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.password}</td>
        <td>${user.space} m2</td>
        <td>${user.period} month(s)</td>
        <td>$${user.amount.toFixed(2)}</td>
        <td>${countdownHTML}</td>
        <td>
          <button class="btn-paid"   onclick="markPaid(${user.id})">✅ Paid</button>
          <button class="btn-edit"   onclick="editUser(${user.id})">Edit</button>
          <button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}
// Mark as Paid
function markPaid(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;

  const today = new Date();
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + user.period);

  const payment = {
    id: Date.now(),
    tenant: user.username,
    amount: user.amount,
    space: user.space,
    period: user.period,
    datePaid: today.toLocaleDateString(),
    nextDue: dueDate.toLocaleDateString(),
    nextDueRaw: dueDate.toISOString(),
  };

  payments.push(payment);
  localStorage.setItem("payments", JSON.stringify(payments));
  renderPayments();
  renderUsers();
  alert(
    `✅ ${user.username} marked as paid. Next due: ${dueDate.toLocaleDateString()}`,
  );
}
function renderPayments() {
  const table = document.getElementById("paymentTable");
  table.innerHTML = "";

  payments.forEach((p) => {
    const nextDue = new Date(p.nextDueRaw);
    const today = new Date();
    const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));

    let countdownHTML = "";
    if (diff > 0) {
      countdownHTML = `<span style="color:#22c55e;font-weight:bold">⏳ ${diff} days left</span>`;
    } else if (diff === 0) {
      countdownHTML = `<span style="color:#f97316;font-weight:bold">⚠️ Due Today!</span>`;
    } else {
      countdownHTML = `<span style="color:#e53e3e;font-weight:bold">🔴 Overdue by ${Math.abs(diff)} days</span>`;
    }

    table.innerHTML += `
      <tr>
        <td>${p.tenant}</td>
        <td>$${p.amount.toFixed(2)}</td>
        <td>${p.space} m2</td>
        <td>${p.period} month(s)</td>
        <td>${p.datePaid}</td>
        <td>${p.nextDue}</td>
        <td>${countdownHTML}</td>
      </tr>
    `;
  });
}
// Edit User
function editUser(id) {
  const user = users.find((u) => u.id === id);
  document.getElementById("userId").value = user.id;
  document.getElementById("username").value = user.username;
  document.getElementById("email").value = user.email;
  document.getElementById("phone").value = user.phone;
  document.getElementById("password").value = user.password;
  document.getElementById("space").value = user.space;
  document.getElementById("period").value = user.period;
  document.getElementById("amount").value = "$" + user.amount.toFixed(2);
}

// Delete User
function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  users = users.filter((u) => u.id !== id);
  localStorage.setItem("users", JSON.stringify(users));
  renderUsers();
  updateDashboard();
}

// Clear Form
function clearForm() {
  document.getElementById("userId").value = "";
  document.getElementById("username").value = "";
  document.getElementById("email").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("password").value = "";
  document.getElementById("space").value = "";
  document.getElementById("period").value = "";
  document.getElementById("amount").value = "";
}

// Update Dashboard
function updateDashboard() {
  // Total users
  document.getElementById("totalUsers").textContent = users.length;

  // Total revenue
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  document.getElementById("totalRevenue").textContent =
    "$" + totalRevenue.toFixed(2);

  // Overdue and due this month
  const today = new Date();
  let overdueCount = 0;
  let dueThisMonth = 0;

  users.forEach((user) => {
    const lastPayment = payments
      .filter((p) => p.tenant === user.username)
      .pop();
    if (lastPayment) {
      const nextDue = new Date(lastPayment.nextDueRaw);
      const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) overdueCount++;
      if (diff >= 0 && diff <= 30) dueThisMonth++;
    } else {
      overdueCount++;
    }
  });

  document.getElementById("overdueCount").textContent = overdueCount;
  document.getElementById("dueThisMonth").textContent = dueThisMonth;

  // Recent payments (last 5)
  const recentTable = document.getElementById("recentPaymentsTable");
  recentTable.innerHTML = "";
  const recent = [...payments].reverse().slice(0, 5);

  if (recent.length === 0) {
    recentTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999">No payments yet</td></tr>`;
  } else {
    recent.forEach((p) => {
      recentTable.innerHTML += `
        <tr>
          <td>${p.tenant}</td>
          <td>$${p.amount.toFixed(2)}</td>
          <td>${p.datePaid}</td>
          <td>${p.nextDue}</td>
        </tr>
      `;
    });
  }

  // Overdue tenants list
  const overdueTable = document.getElementById("overdueTable");
  overdueTable.innerHTML = "";
  let hasOverdue = false;

  users.forEach((user) => {
    const lastPayment = payments
      .filter((p) => p.tenant === user.username)
      .pop();
    let isOverdue = false;
    let overdueDays = 0;

    if (lastPayment) {
      const nextDue = new Date(lastPayment.nextDueRaw);
      const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) {
        isOverdue = true;
        overdueDays = Math.abs(diff);
      }
    } else {
      isOverdue = true;
      overdueDays = "Never paid";
    }

    if (isOverdue) {
      hasOverdue = true;
      overdueTable.innerHTML += `
        <tr>
          <td>${user.username}</td>
          <td>${user.phone}</td>
          <td>$${user.amount.toFixed(2)}</td>
          <td><span style="color:#e53e3e;font-weight:bold">${overdueDays === "Never paid" ? "Never paid" : overdueDays + " days"}</span></td>
        </tr>
      `;
    }
  });

  if (!hasOverdue) {
    overdueTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#22c55e;font-weight:bold">✅ All tenants are up to date!</td></tr>`;
  }
}
// Render Requests
function renderRequests() {
  requests = JSON.parse(localStorage.getItem("requests")) || [];
  const table = document.getElementById("requestsTable");
  table.innerHTML = "";

  if (requests.length === 0) {
    table.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#999;padding:20px;">No requests yet</td></tr>`;
  } else {
    [...requests].reverse().forEach((r) => {
      let statusBadge = "";
      if (r.status === "Pending") {
        statusBadge = `<span style="color:#d97706;font-weight:bold">⏳ Pending</span>`;
      } else if (r.status === "Accepted") {
        statusBadge = `<span style="color:#22c55e;font-weight:bold">✅ Accepted</span>`;
      } else {
        statusBadge = `<span style="color:#e53e3e;font-weight:bold">❌ Rejected</span>`;
      }

      let actionsHTML = "";
      if (r.status === "Pending") {
        actionsHTML = `
          <button class="btn-paid" onclick="acceptRequest(${r.id})">✅ Accept</button>
          <button class="btn-delete" onclick="openRejectModal(${r.id})">❌ Reject</button>
        `;
      } else {
        actionsHTML = `<span style="color:#999;font-size:12px;">—</span>`;
      }

      table.innerHTML += `
        <tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.phone}</td>
          <td>${r.space} m2</td>
          <td>${r.message || "—"}</td>
          <td>${r.date}</td>
          <td>${statusBadge}</td>
          <td style="font-size:12px;color:#666;">${r.reason || "—"}</td>
          <td>${actionsHTML}</td>
        </tr>
      `;
    });
  }

  // Update stat cards
  document.getElementById("totalRequests").textContent = requests.length;
  document.getElementById("pendingRequests").textContent = requests.filter(
    (r) => r.status === "Pending",
  ).length;
  document.getElementById("acceptedRequests").textContent = requests.filter(
    (r) => r.status === "Accepted",
  ).length;
  document.getElementById("rejectedRequests").textContent = requests.filter(
    (r) => r.status === "Rejected",
  ).length;

  // Update sidebar badge
  const pending = requests.filter((r) => r.status === "Pending").length;
  const badge = document.getElementById("requestBadge");
  if (pending > 0) {
    badge.style.display = "inline-block";
    badge.textContent = pending;
  } else {
    badge.style.display = "none";
  }
}

// Accept Request
function acceptRequest(id) {
  if (!confirm("Accept this request and add as user?")) return;
  const r = requests.find((r) => r.id === id);
  r.status = "Accepted";
  localStorage.setItem("requests", JSON.stringify(requests));

  // Pre-fill user form
  document.getElementById("username").value = r.name;
  document.getElementById("email").value = r.email;
  document.getElementById("phone").value = r.phone;
  document.getElementById("space").value = r.space;

  // Switch to users page
  pages.forEach((p) => p.classList.remove("active"));
  document.getElementById("users").classList.add("active");
  links.forEach((l) => l.classList.remove("active"));
  document.querySelector('[data-page="users"]').classList.add("active");

  renderRequests();
  alert("✅ Request accepted! Please complete the user form and save.");
}

// Open Reject Modal
function openRejectModal(id) {
  rejectTargetId = id;
  document.getElementById("rejectReason").value = "";
  const modal = document.getElementById("rejectModal");
  modal.style.display = "flex";
}

// Close Reject Modal
function closeRejectModal() {
  document.getElementById("rejectModal").style.display = "none";
  rejectTargetId = null;
}

// Confirm Reject
function confirmReject() {
  const reason = document.getElementById("rejectReason").value.trim();
  if (!reason) {
    alert("Please enter a reason for rejection");
    return;
  }
  const r = requests.find((r) => r.id === rejectTargetId);
  r.status = "Rejected";
  r.reason = reason;
  localStorage.setItem("requests", JSON.stringify(requests));
  closeRejectModal();
  renderRequests();
}
