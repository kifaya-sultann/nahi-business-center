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
let users = JSON.parse(localStorage.getItem("users")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];
let spaces = JSON.parse(localStorage.getItem("spaces")) || [];
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let pricePerM2 = parseFloat(localStorage.getItem("pricePerM2")) || 10;

// Load on start
window.addEventListener("load", () => {
  document.getElementById("pricePerM2").value = pricePerM2;
  document.getElementById("settingsPhone").value =
    localStorage.getItem("bizPhone") || "";
  document.getElementById("settingsEmail").value =
    localStorage.getItem("bizEmail") || "";
  document.getElementById("settingsTelegram").value =
    localStorage.getItem("bizTelegram") || "";
  updateDashboard();
  renderUsers();
  renderPayments();
  renderServiceRequests();
  renderSpaces();
  renderExpenses();
});

// Auto calculate amount
document.getElementById("space").addEventListener("input", calcAmount);
document.getElementById("period").addEventListener("change", calcAmount);
document.getElementById("spaceSize").addEventListener("input", calcSpacePrice);

function calcAmount() {
  const space = parseFloat(document.getElementById("space").value) || 0;
  const period = parseFloat(document.getElementById("period").value) || 0;
  const amount = space * pricePerM2 * period;
  document.getElementById("amount").value =
    amount > 0 ? "$" + amount.toFixed(2) : "";
}

function toggleManualAmount() {
  const btn = document.getElementById("manualToggleBtn");
  const amountField = document.getElementById("amount");
  const isManual = amountField.hasAttribute("readonly");

  if (isManual) {
    amountField.removeAttribute("readonly");
    amountField.placeholder = "Enter amount manually";
    amountField.value = "";
    amountField.style.background = "#fff";
    amountField.style.cursor = "text";
    btn.textContent = "🔄 Auto";
    btn.style.background = "#0f3d2e";
    btn.style.color = "white";
    btn.style.borderColor = "#0f3d2e";
  } else {
    amountField.setAttribute("readonly", true);
    amountField.placeholder = "Amount (auto)";
    amountField.style.background = "#f0f0f0";
    amountField.style.cursor = "not-allowed";
    btn.textContent = "✏️ Manual";
    btn.style.background = "#e2e8f0";
    btn.style.color = "#555";
    btn.style.borderColor = "#ddd";
    calcAmount();
  }
}

function calcSpacePrice() {
  const size = parseFloat(document.getElementById("spaceSize").value) || 0;
  const price = size * pricePerM2;
  document.getElementById("spacePrice").value =
    price > 0 ? "$" + price.toFixed(2) + "/month" : "";
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
  const phone = document.getElementById("settingsPhone").value.trim();
  const email = document.getElementById("settingsEmail").value.trim();
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
    showMsg(
      "passwordMsg",
      "❌ New password must be at least 4 characters",
      "red",
    );
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

// Helper
function showMsg(id, text, color) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = color === "green" ? "#22c55e" : "#e53e3e";
  setTimeout(() => (el.textContent = ""), 3000);
}

// Save User
function saveUser() {
  const id = document.getElementById("userId").value;
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const fanfin = document.getElementById("fanfin").value.trim();
  const password = document.getElementById("password").value.trim();
  const space = parseFloat(document.getElementById("space").value);
  const period = parseInt(document.getElementById("period").value);

  if (
    !username ||
    !email ||
    !phone ||
    !fanfin ||
    !password ||
    !space ||
    !period
  ) {
    alert("Please fill all fields");
    return;
  }

  const manualAmount = !document
    .getElementById("amount")
    .hasAttribute("readonly");
  const amountValue = document
    .getElementById("amount")
    .value.replace("$", "")
    .trim();
  const amount = manualAmount
    ? parseFloat(amountValue)
    : space * pricePerM2 * period;

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  // *** FIX: grab old username BEFORE updating ***
  const oldUsername = id
    ? users.find((u) => u.id == id)?.username || null
    : null;

  if (id) {
    const index = users.findIndex((u) => u.id == id);
    users[index] = {
      ...users[index],
      username,
      email,
      phone,
      fanfin,
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
      fanfin,
      password,
      space,
      period,
      amount,
    });
  }

  localStorage.setItem("users", JSON.stringify(users));

  // *** FIX: if username changed, update payments and service requests ***
  if (oldUsername && oldUsername !== username) {
    payments = payments.map((p) =>
      p.tenant === oldUsername ? { ...p, tenant: username } : p,
    );
    localStorage.setItem("payments", JSON.stringify(payments));

    let myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
    myRequests = myRequests.map((r) =>
      r.tenant === oldUsername ? { ...r, tenant: username } : r,
    );
    localStorage.setItem("myRequests", JSON.stringify(myRequests));

    // Also update loggedInUser if they're currently logged in
    if (localStorage.getItem("loggedInUser") === oldUsername) {
      localStorage.setItem("loggedInUser", username);
    }
  }

  clearForm();
  renderUsers();
  renderPayments();
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
        <td>${user.fanfin || "—"}</td>
        <td>${user.password}</td>
        <td>${user.space} m2</td>
        <td>${user.period} month(s)</td>
        <td>$${user.amount.toFixed(2)}</td>
        <td>${countdownHTML}</td>
        <td>
          <button class="btn-paid" onclick="markPaid(${user.id})">✅ Paid</button>
          <button class="btn-edit" onclick="editUser(${user.id})">Edit</button>
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

// Render Payments
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
  document.getElementById("fanfin").value = user.fanfin || "";
  document.getElementById("password").value = user.password;
  document.getElementById("space").value = user.space;
  document.getElementById("period").value = user.period;
  document.getElementById("amount").value = "$" + user.amount.toFixed(2);
}

// Delete User
function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  const user = users.find((u) => u.id === id);
  users = users.filter((u) => u.id !== id);
  localStorage.setItem("users", JSON.stringify(users));
  let allPayments = JSON.parse(localStorage.getItem("payments")) || [];
  allPayments = allPayments.filter((p) => p.tenant !== user.username);
  localStorage.setItem("payments", JSON.stringify(allPayments));
  payments = allPayments;
  let myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
  myRequests = myRequests.filter((r) => r.tenant !== user.username);
  localStorage.setItem("myRequests", JSON.stringify(myRequests));
  if (localStorage.getItem("loggedInUser") === user.username) {
    localStorage.removeItem("loggedInUser");
  }
  renderUsers();
  renderPayments();
  renderServiceRequests();
  updateDashboard();
}

// Clear Form
function clearForm() {
  document.getElementById("userId").value = "";
  document.getElementById("username").value = "";
  document.getElementById("email").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("fanfin").value = "";
  document.getElementById("password").value = "";
  document.getElementById("space").value = "";
  document.getElementById("period").value = "";
  document.getElementById("amount").value = "";
  const amountField = document.getElementById("amount");
  const btn = document.getElementById("manualToggleBtn");
  amountField.setAttribute("readonly", true);
  amountField.placeholder = "Amount (auto)";
  amountField.style.background = "#f0f0f0";
  amountField.style.cursor = "not-allowed";
  btn.textContent = "✏️ Manual";
  btn.style.background = "#e2e8f0";
  btn.style.color = "#555";
  btn.style.borderColor = "#ddd";
}

// Update Dashboard
function updateDashboard() {
  document.getElementById("totalUsers").textContent = users.length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  document.getElementById("totalRevenue").textContent =
    "$" + totalRevenue.toFixed(2);
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

// Render Service Requests
function renderServiceRequests() {
  const myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
  const table = document.getElementById("serviceRequestsTable");
  table.innerHTML = "";
  if (myRequests.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">No service requests yet</td></tr>`;
  } else {
    [...myRequests].reverse().forEach((r) => {
      let statusHTML = "";
      if (r.status === "Pending") {
        statusHTML = `<span style="color:#d97706;font-weight:bold;">⏳ Pending</span>`;
      } else if (r.status === "In Progress") {
        statusHTML = `<span style="color:#3b82f6;font-weight:bold;">🔄 In Progress</span>`;
      } else {
        statusHTML = `<span style="color:#22c55e;font-weight:bold;">✅ Done</span>`;
      }
      let actionsHTML = "";
      if (r.status === "Pending") {
        actionsHTML = `
          <button class="btn-edit" onclick="updateServiceRequest(${r.id}, 'In Progress')">🔄 In Progress</button>
          <button class="btn-paid" onclick="updateServiceRequest(${r.id}, 'Done')">✅ Done</button>
        `;
      } else if (r.status === "In Progress") {
        actionsHTML = `<button class="btn-paid" onclick="updateServiceRequest(${r.id}, 'Done')">✅ Mark Done</button>`;
      } else {
        actionsHTML = `<span style="color:#999;font-size:12px;">—</span>`;
      }
      table.innerHTML += `
        <tr>
          <td>${r.id}</td>
          <td>${r.tenant}</td>
          <td>${r.type}</td>
          <td>${r.description}</td>
          <td>${r.date}</td>
          <td>${statusHTML}</td>
          <td>${actionsHTML}</td>
        </tr>
      `;
    });
  }
  document.getElementById("totalServiceReqs").textContent = myRequests.length;
  document.getElementById("pendingServiceReqs").textContent = myRequests.filter(
    (r) => r.status === "Pending",
  ).length;
  document.getElementById("inProgressServiceReqs").textContent =
    myRequests.filter((r) => r.status === "In Progress").length;
  document.getElementById("doneServiceReqs").textContent = myRequests.filter(
    (r) => r.status === "Done",
  ).length;
  const pending = myRequests.filter((r) => r.status === "Pending").length;
  const badge = document.getElementById("serviceRequestBadge");
  if (pending > 0) {
    badge.style.display = "inline-block";
    badge.textContent = pending;
  } else {
    badge.style.display = "none";
  }
}

// Update Service Request Status
function updateServiceRequest(id, status) {
  let myRequests = JSON.parse(localStorage.getItem("myRequests")) || [];
  const index = myRequests.findIndex((r) => r.id === id);
  if (index === -1) return;
  myRequests[index].status = status;
  localStorage.setItem("myRequests", JSON.stringify(myRequests));
  renderServiceRequests();
}

// Save Space
function saveSpace() {
  const id = document.getElementById("spaceId").value;
  const floor = parseInt(document.getElementById("spaceFloor").value);
  const room = document.getElementById("spaceRoom").value.trim();
  const size = parseFloat(document.getElementById("spaceSize").value);
  const status = document.getElementById("spaceStatus").value;
  if (!floor || !room || !size) {
    alert("Please fill all fields");
    return;
  }
  const price = size * pricePerM2;
  if (id) {
    const index = spaces.findIndex((s) => s.id == id);
    spaces[index] = { ...spaces[index], floor, room, size, status, price };
  } else {
    const newId =
      spaces.length > 0 ? Math.max(...spaces.map((s) => s.id)) + 1 : 1;
    spaces.push({ id: newId, floor, room, size, status, price });
  }
  localStorage.setItem("spaces", JSON.stringify(spaces));
  clearSpaceForm();
  renderSpaces();
}

// Render Spaces Table
function renderSpaces() {
  spaces = JSON.parse(localStorage.getItem("spaces")) || [];
  const table = document.getElementById("spacesTable");
  table.innerHTML = "";
  if (spaces.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">No spaces added yet</td></tr>`;
    return;
  }
  spaces.forEach((s) => {
    const statusHTML =
      s.status === "Available"
        ? `<span style="color:#22c55e;font-weight:bold;">✅ Available</span>`
        : `<span style="color:#e53e3e;font-weight:bold;">🔴 Occupied</span>`;
    table.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>Floor ${s.floor}</td>
        <td>Room ${s.room}</td>
        <td>${s.size} m2</td>
        <td>$${s.price.toFixed(2)}/month</td>
        <td>${statusHTML}</td>
        <td>
          <button class="btn-edit" onclick="editSpace(${s.id})">Edit</button>
          <button class="btn-delete" onclick="deleteSpace(${s.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

// Edit Space
function editSpace(id) {
  const s = spaces.find((s) => s.id === id);
  document.getElementById("spaceId").value = s.id;
  document.getElementById("spaceFloor").value = s.floor;
  document.getElementById("spaceRoom").value = s.room;
  document.getElementById("spaceSize").value = s.size;
  document.getElementById("spaceStatus").value = s.status;
  document.getElementById("spacePrice").value =
    "$" + s.price.toFixed(2) + "/month";
}

// Delete Space
function deleteSpace(id) {
  if (!confirm("Are you sure you want to delete this space?")) return;
  spaces = spaces.filter((s) => s.id !== id);
  localStorage.setItem("spaces", JSON.stringify(spaces));
  renderSpaces();
}

// Clear Space Form
function clearSpaceForm() {
  document.getElementById("spaceId").value = "";
  document.getElementById("spaceFloor").value = "";
  document.getElementById("spaceRoom").value = "";
  document.getElementById("spaceSize").value = "";
  document.getElementById("spaceStatus").value = "Available";
  document.getElementById("spacePrice").value = "";
}

// Save Expense
function saveExpense() {
  const id = document.getElementById("expenseId").value;
  const date =
    document.getElementById("expenseDate").value ||
    new Date().toISOString().split("T")[0];
  const name = document.getElementById("expenseName").value.trim();
  const reason = document.getElementById("expenseReason").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const period = parseInt(document.getElementById("expensePeriod").value);

  if (!name || !reason || !amount || !period) {
    alert("Please fill all fields");
    return;
  }

  const paidDate = new Date(date);
  paidDate.setDate(paidDate.getDate() + period);
  const dueDate = paidDate.toLocaleDateString();
  const dueDateRaw = paidDate.toISOString();

  if (id) {
    const index = expenses.findIndex((e) => e.id == id);
    expenses[index] = {
      ...expenses[index],
      name,
      reason,
      amount,
      date,
      period,
      dueDate,
      dueDateRaw,
    };
  } else {
    const newId =
      expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;
    expenses.push({
      id: newId,
      name,
      reason,
      amount,
      date,
      period,
      dueDate,
      dueDateRaw,
    });
  }

  localStorage.setItem("expenses", JSON.stringify(expenses));
  clearExpenseForm();
  renderExpenses();
}
// Render Expenses
function renderExpenses() {
  expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  const table = document.getElementById("expensesTable");
  table.innerHTML = "";

  if (expenses.length === 0) {
    table.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#999;padding:20px;">No expenses recorded yet</td></tr>`;
  } else {
    [...expenses].reverse().forEach((e) => {
      let countdownHTML = "—";
      if (e.dueDateRaw) {
        const due = new Date(e.dueDateRaw);
        const today = new Date();
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          countdownHTML = `<span style="color:#22c55e;font-weight:bold;">⏳ ${diff} days left</span>`;
        } else if (diff === 0) {
          countdownHTML = `<span style="color:#f97316;font-weight:bold;">⚠️ Due Today!</span>`;
        } else {
          countdownHTML = `<span style="color:#e53e3e;font-weight:bold;">🔴 Overdue by ${Math.abs(diff)} days</span>`;
        }
      }
      const periodLabel =
        e.period === 15 ? "15 Days" : e.period === 30 ? "1 Month" : "3 Months";
      table.innerHTML += `
        <tr>
          <td>${e.id}</td>
          <td>${e.name}</td>
          <td>${e.reason}</td>
          <td>$${parseFloat(e.amount).toFixed(2)}</td>
          <td>${e.date}</td>
          <td>${periodLabel}</td>
          <td>${e.dueDate || "—"}</td>
          <td>${countdownHTML}</td>
          <td>
            <button class="btn-edit" onclick="editExpense(${e.id})">Edit</button>
            <button class="btn-delete" onclick="deleteExpense(${e.id})">Delete</button>
          </td>
        </tr>
      `;
    });
  }

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  document.getElementById("totalExpenses").textContent = "$" + total.toFixed(2);
  document.getElementById("totalExpenseRecords").textContent = expenses.length;
}

// Edit Expense
function editExpense(id) {
  const e = expenses.find((e) => e.id === id);
  document.getElementById("expenseId").value = e.id;
  document.getElementById("expenseName").value = e.name;
  document.getElementById("expenseReason").value = e.reason;
  document.getElementById("expenseAmount").value = e.amount;
  document.getElementById("expenseDate").value = e.date;
  document.getElementById("expensePeriod").value = e.period || "";
}

// Delete Expense
function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  expenses = expenses.filter((e) => e.id !== id);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderExpenses();
}

// Clear Expense Form
function clearExpenseForm() {
  document.getElementById("expenseId").value = "";
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseReason").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDate").value = "";
  document.getElementById("expensePeriod").value = "";
}
