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
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
});

// Block access if not logged in as admin
const currentUserRaw = localStorage.getItem("currentUser");
const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
if (
  !localStorage.getItem("token") ||
  !currentUser ||
  currentUser.role !== "admin"
) {
  window.location.href = "login.html";
}

// Data
let users = [];
let payments = [];
let spaces = [];
let expenses = [];
let pricePerM2 = parseFloat(localStorage.getItem("pricePerM2")) || 10;

// Load on start
window.addEventListener("load", async () => {
  document.getElementById("pricePerM2").value = pricePerM2;
  document.getElementById("settingsPhone").value =
    localStorage.getItem("bizPhone") || "";
  document.getElementById("settingsEmail").value =
    localStorage.getItem("bizEmail") || "";
  document.getElementById("settingsTelegram").value =
    localStorage.getItem("bizTelegram") || "";
  await loadAllData();
});

async function loadAllData() {
  // 1. Load users first
  await loadUsers();

  // 2. Load settings from backend
  try {
    const settings = await apiRequest("/settings");
    pricePerM2 = settings.pricePerM2 || 10;
    document.getElementById("pricePerM2").value = pricePerM2;
    document.getElementById("settingsPhone").value = settings.phone || "";
    document.getElementById("settingsEmail").value = settings.email || "";
    document.getElementById("settingsTelegram").value = settings.telegram || "";
  } catch (e) {
    console.error("Failed to load settings from backend:", e);
    // Fallback to localStorage if backend fails
    pricePerM2 = parseFloat(localStorage.getItem("pricePerM2")) || 10;
    document.getElementById("pricePerM2").value = pricePerM2;
    document.getElementById("settingsPhone").value =
      localStorage.getItem("bizPhone") || "";
    document.getElementById("settingsEmail").value =
      localStorage.getItem("bizEmail") || "";
    document.getElementById("settingsTelegram").value =
      localStorage.getItem("bizTelegram") || "";
  }

  // 3. Load all other data
  await Promise.all([
    loadPayments(),
    loadSpaces(),
    loadExpenses(),
    loadServiceRequests(),
    loadDashboard(),
  ]);

  // 4. Render everything
  renderUsers();
  renderPayments();
}

async function loadUsers() {
  try {
    users = await apiRequest("/users");
    renderUsers();
  } catch (e) {
    console.error("Failed to load users:", e);
  }
}

async function loadPayments() {
  try {
    const allPayments = await apiRequest("/payments/all");

    // If no users exist, show no payments
    if (users.length === 0) {
      payments = [];
      renderPayments();
      return;
    }

    // Only show payments from users that still exist
    const activeUsernames = users.map((u) => u.username);
    payments = allPayments.filter((p) => activeUsernames.includes(p.tenant));

    renderPayments();
  } catch (e) {
    console.error("Failed to load payments:", e);
  }
}

async function loadSpaces() {
  try {
    spaces = await apiRequest("/spaces");
    renderSpaces();
  } catch (e) {
    console.error("Failed to load spaces:", e);
  }
}

async function loadExpenses() {
  try {
    expenses = await apiRequest("/expenses");
    renderExpenses();
  } catch (e) {
    console.error("Failed to load expenses:", e);
  }
}

async function loadServiceRequests() {
  try {
    const requests = await apiRequest("/service-requests");
    renderServiceRequests(requests);
  } catch (e) {
    console.error("Failed to load service requests:", e);
  }
}

async function loadDashboard() {
  try {
    const stats = await apiRequest("/dashboard/stats");

    // If no users exist, show empty state
    if (users.length === 0) {
      document.getElementById("totalUsers").textContent = "0";

      document.getElementById("overdueCount").textContent = "0";
      document.getElementById("dueThisMonth").textContent = "0";

      const recentTable = document.getElementById("recentPaymentsTable");
      recentTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999">No users found</td></tr>`;

      const overdueTable = document.getElementById("overdueTable");
      overdueTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#22c55e;font-weight:bold">✅ All tenants are up to date!</td></tr>`;
      return;
    }

    document.getElementById("totalUsers").textContent = stats.totalUsers;

    document.getElementById("overdueCount").textContent = stats.overdueCount;
    document.getElementById("dueThisMonth").textContent = stats.dueThisMonth;

    const recentTable = document.getElementById("recentPaymentsTable");
    recentTable.innerHTML = "";
    if (!stats.recentPayments || stats.recentPayments.length === 0) {
      recentTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999">No payments yet</td></tr>`;
    } else {
      // Filter out payments from deleted users
      const activeUsernames = users.map((u) => u.username);
      const filteredPayments = stats.recentPayments.filter((p) =>
        activeUsernames.includes(p.tenant),
      );

      if (filteredPayments.length === 0) {
        recentTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999">No payments from active users</td></tr>`;
      } else {
        filteredPayments.forEach((p) => {
          const userExists = users.find((u) => u.username === p.tenant);
          const isMovedOut = userExists
            ? userExists.status === "Moved Out"
            : false;

          recentTable.innerHTML += `
            <tr>
              <td>${p.tenant} ${isMovedOut ? '<span style="background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;margin-left:6px;">Moved Out</span>' : ""}</td>
              <td>$${parseFloat(p.amount).toFixed(2)}</td>
              <td>${p.datePaid}</td>
              <td>${p.nextDue}</td>
            </tr>
          `;
        });
      }
    }

    const overdueTable = document.getElementById("overdueTable");
    overdueTable.innerHTML = "";
    // Filter out overdue tenants that don't exist anymore
    const activeUsernames2 = users.map((u) => u.username);
    const filteredOverdue = stats.overdueTenants
      ? stats.overdueTenants.filter((u) =>
          activeUsernames2.includes(u.username),
        )
      : [];

    if (!filteredOverdue || filteredOverdue.length === 0) {
      overdueTable.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#22c55e;font-weight:bold">✅ All tenants are up to date!</td></tr>`;
    } else {
      filteredOverdue.forEach((u) => {
        overdueTable.innerHTML += `
          <tr>
            <td>${u.username}</td>
            <td>${u.phone}</td>
            <td>$${parseFloat(u.amount).toFixed(2)}</td>
            <td><span style="color:#e53e3e;font-weight:bold">${u.overdueDays === "Never paid" ? "Never paid" : u.overdueDays + " days"}</span></td>
          </tr>
        `;
      });
    }
  } catch (e) {
    console.error("Failed to load dashboard:", e);
  }
}

async function saveSettings() {
  const val = parseFloat(document.getElementById("pricePerM2").value);
  if (!val || val <= 0) {
    alert("Please enter a valid price");
    return;
  }

  try {
    await apiRequest("/settings", {
      method: "PUT",
      body: JSON.stringify({ pricePerM2: val }),
    });
    pricePerM2 = val;
    showMsg("settingsMsg", "✅ Price saved successfully!", "green");
  } catch (e) {
    showMsg("settingsMsg", "❌ " + e.message, "red");
  }
}

async function saveBusinessInfo() {
  const phone = document.getElementById("settingsPhone").value.trim();
  const email = document.getElementById("settingsEmail").value.trim();
  const telegram = document.getElementById("settingsTelegram").value.trim();

  if (!phone || !email || !telegram) {
    alert("Please fill all fields");
    return;
  }

  try {
    await apiRequest("/settings/business", {
      method: "PUT",
      body: JSON.stringify({ phone, email, telegram }),
    });
    showMsg("businessInfoMsg", "✅ Business info saved!", "green");
  } catch (e) {
    showMsg("businessInfoMsg", "❌ " + e.message, "red");
  }
}

async function changePassword() {
  const current = document.getElementById("currentPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!current) {
    showMsg("passwordMsg", "❌ Please enter current password", "red");
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

  try {
    await apiRequest("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: current,
        newPassword: newPass,
      }),
    });
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    showMsg("passwordMsg", "✅ Password changed successfully!", "green");
  } catch (e) {
    showMsg("passwordMsg", "❌ " + e.message, "red");
  }
}

function showMsg(id, text, color) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = color === "green" ? "#22c55e" : "#e53e3e";
  setTimeout(() => (el.textContent = ""), 3000);
}

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

async function saveUser() {
  const id = document.getElementById("userId").value;
  const username = document
    .getElementById("username")
    .value.trim()
    .toLowerCase();
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

  const parts = username.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    alert("Invalid username format. Use: name/floor (e.g. ismael/03)");
    return;
  }

  const floorNum = parseInt(parts[1]);
  if (parts[1] === "00") {
    alert("❌ Floor /00 is reserved for admin. Please use floors 01 to 05.");
    return;
  }
  if (floorNum < 1 || floorNum > 5) {
    alert("❌ Invalid floor number. Only floors 01 to 05 are allowed.");
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

  try {
    if (id) {
      await apiRequest(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          username,
          email,
          phone,
          fanfin,
          password,
          space,
          period,
          amount,
        }),
      });
    } else {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          phone,
          fanfin,
          password,
          space,
          period,
          amount,
        }),
      });
    }
    clearForm();
    await loadUsers();
    await loadDashboard();
    alert(id ? "✅ User updated!" : "✅ User created!");
  } catch (e) {
    alert("❌ " + e.message);
  }
}

let currentFilter = "all";

function filterUsers(filter) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");
  renderUsers();
}

function renderUsers() {
  const table = document.getElementById("userTable");
  table.innerHTML = "";
  const search =
    document.getElementById("userSearch")?.value.toLowerCase() || "";

  const filtered = users.filter((user) => {
    const matchesFilter =
      currentFilter === "active"
        ? user.status !== "Moved Out"
        : currentFilter === "movedout"
          ? user.status === "Moved Out"
          : true;
    const matchesSearch =
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.phone.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  filtered.forEach((user) => {
    const lastPayment = payments
      .filter((p) => p.tenant === user.username)
      .pop();
    let countdownHTML = '<span style="color:#999">No payment yet</span>';
    if (lastPayment) {
      const nextDue = new Date(lastPayment.nextDueRaw);
      const today = new Date();
      const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
      if (diff > 0)
        countdownHTML = `<span style="color:#22c55e;font-weight:bold">⏳ ${diff} days left</span>`;
      else if (diff === 0)
        countdownHTML = `<span style="color:#f97316;font-weight:bold">⚠️ Due Today!</span>`;
      else
        countdownHTML = `<span style="color:#e53e3e;font-weight:bold">🔴 Overdue by ${Math.abs(diff)} days</span>`;
    }

    const statusHTML =
      user.status === "Moved Out"
        ? `<span style="color:#999;font-weight:bold;">🚪 Moved Out</span>`
        : `<span style="color:#22c55e;font-weight:bold;">✅ Active</span>`;

    const actionsHTML =
      user.status === "Moved Out"
        ? `
        <button class="btn-paid" onclick="reactivate('${user.id}')">🔄 Reactivate</button>
        <button class="btn-edit" onclick="editUser('${user.id}')">Edit</button>
        <button class="btn-delete" onclick="deleteUser('${user.id}')">Delete</button>
      `
        : `
        <button class="btn-paid" onclick="markPaid('${user.id}')">✅ Paid</button>
        <button class="btn-edit" onclick="editUser('${user.id}')">Edit</button>
        <button class="btn-moveout" onclick="moveOut('${user.id}')">🚪 Move Out</button>
        <button class="btn-delete" onclick="deleteUser('${user.id}')">Delete</button>
      `;

    table.innerHTML += `
      <tr style="${user.status === "Moved Out" ? "opacity:0.6;" : ""}">
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.fanfin || "—"}</td>
        <td>${user.password}</td>
        <td>${user.space} m2</td>
        <td>${user.period} month(s)</td>
        <td>$${parseFloat(user.amount).toFixed(2)}</td>
        <td>${countdownHTML}</td>
        <td>${statusHTML}</td>
        <td>${actionsHTML}</td>
      </tr>
    `;
  });
}

async function markPaid(id) {
  const user = users.find((u) => u.id == id);
  if (!user) return;
  try {
    const result = await apiRequest("/payments", {
      method: "POST",
      body: JSON.stringify({ userId: id }),
    });
    await loadPayments();
    await loadUsers();
    await loadDashboard();
    if (result && result.payment && result.payment.nextDue) {
      alert(
        `✅ ${user.username} marked as paid. Next due: ${result.payment.nextDue}`,
      );
    } else {
      alert(`✅ ${user.username} marked as paid!`);
    }
  } catch (e) {
    alert("❌ " + e.message);
  }
}

async function moveOut(id) {
  if (
    !confirm(
      "Mark this user as Moved Out? Their space will become available again.",
    )
  )
    return;
  const user = users.find((u) => u.id == id);
  if (!user) return;
  try {
    await apiRequest(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "Moved Out" }),
    });

    const parts = user.username.split("/");
    const floorNumber = parts.length === 2 ? parseInt(parts[1]) : 0;
    const price = user.space * pricePerM2;
    await apiRequest("/spaces", {
      method: "POST",
      body: JSON.stringify({
        floor: floorNumber,
        room: "—",
        size: user.space,
        status: "Available",
        price,
      }),
    });

    await loadUsers();
    await loadSpaces();
    await loadDashboard();
    alert(`🚪 ${user.username} has been marked as Moved Out!`);
  } catch (e) {
    alert("❌ " + e.message);
  }
}

async function reactivate(id) {
  if (!confirm("Reactivate this user?")) return;
  const user = users.find((u) => u.id == id);
  if (!user) return;
  try {
    await apiRequest(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "Active" }),
    });

    const parts = user.username.split("/");
    const floorNumber = parts.length === 2 ? parseInt(parts[1]) : 0;
    const spaceToRemove = spaces.find(
      (s) =>
        s.floor === floorNumber &&
        s.status === "Available" &&
        s.size === user.space,
    );

    // ✅ Only try to delete if space exists
    if (spaceToRemove) {
      try {
        await apiRequest(`/spaces/${spaceToRemove.id}`, {
          method: "DELETE",
        });
        console.log("✅ Space deleted:", spaceToRemove.id);
      } catch (e) {
        console.warn("⚠️ Could not delete space:", e.message);
      }
    } else {
      console.log("ℹ️ No space found to delete — continuing");
    }

    await loadUsers();
    await loadSpaces();
    await loadDashboard();
    alert(`✅ ${user.username} has been reactivated!`);
  } catch (e) {
    alert("❌ " + e.message);
  }
}

function editUser(id) {
  const user = users.find((u) => u.id == id);
  document.getElementById("userId").value = user.id;
  document.getElementById("username").value = user.username;
  document.getElementById("email").value = user.email;
  document.getElementById("phone").value = user.phone;
  document.getElementById("fanfin").value = user.fanfin || "";
  document.getElementById("password").value = user.password;
  document.getElementById("space").value = user.space;
  document.getElementById("period").value = user.period;
  document.getElementById("amount").value =
    "$" + parseFloat(user.amount).toFixed(2);
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await apiRequest(`/users/${id}`, { method: "DELETE" });
    await loadUsers();
    await loadPayments();
    await loadDashboard();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

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

let currentPaymentPage = 1;
const paymentsPerPage = 5;

function renderPayments() {
  const search =
    document.getElementById("paymentSearch")?.value.toLowerCase() || "";
  const table = document.getElementById("paymentTable");
  table.innerHTML = "";

  const filtered = payments.filter((p) =>
    p.tenant.toLowerCase().includes(search),
  );
  const totalPages = Math.ceil(filtered.length / paymentsPerPage);
  if (currentPaymentPage > totalPages) currentPaymentPage = 1;

  const start = (currentPaymentPage - 1) * paymentsPerPage;
  const paginated = filtered.slice(start, start + paymentsPerPage);

  if (paginated.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">No payments found</td></tr>`;
  } else {
    paginated.forEach((p) => {
      const nextDue = new Date(p.nextDueRaw);
      const today = new Date();
      const diff = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
      let countdownHTML = "";
      if (diff > 0)
        countdownHTML = `<span style="color:#22c55e;font-weight:bold">⏳ ${diff} days left</span>`;
      else if (diff === 0)
        countdownHTML = `<span style="color:#f97316;font-weight:bold">⚠️ Due Today!</span>`;
      else
        countdownHTML = `<span style="color:#e53e3e;font-weight:bold">🔴 Overdue by ${Math.abs(diff)} days</span>`;

      const isMovedOut = users.find(
        (u) => u.username === p.tenant && u.status === "Moved Out",
      );
      table.innerHTML += `
        <tr>
          <td>${p.tenant} ${isMovedOut ? '<span style="background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;margin-left:6px;">Moved Out</span>' : ""}</td>
          <td>$${parseFloat(p.amount).toFixed(2)}</td>
          <td>${p.space} m2</td>
          <td>${p.period} month(s)</td>
          <td>${p.datePaid}</td>
          <td>${p.nextDue}</td>
          <td>${countdownHTML}</td>
        </tr>
      `;
    });
  }

  const pagination = document.getElementById("paymentPagination");
  pagination.innerHTML = "";
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Prev";
  prevBtn.disabled = currentPaymentPage === 1;
  prevBtn.onclick = () => {
    currentPaymentPage--;
    renderPayments();
  };
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPaymentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPaymentPage = i;
      renderPayments();
    };
    pagination.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.disabled = currentPaymentPage === totalPages;
  nextBtn.onclick = () => {
    currentPaymentPage++;
    renderPayments();
  };
  pagination.appendChild(nextBtn);
}

function renderServiceRequests(requests = []) {
  const table = document.getElementById("serviceRequestsTable");
  table.innerHTML = "";

  if (requests.length === 0) {
    table.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">No service requests yet</td></tr>`;
  } else {
    [...requests].reverse().forEach((r) => {
      let statusHTML = "";
      if (r.status === "Pending")
        statusHTML = `<span style="color:#d97706;font-weight:bold;">⏳ Pending</span>`;
      else if (r.status === "In Progress")
        statusHTML = `<span style="color:#3b82f6;font-weight:bold;">🔄 In Progress</span>`;
      else
        statusHTML = `<span style="color:#22c55e;font-weight:bold;">✅ Done</span>`;

      let actionsHTML = "";
      if (r.status === "Pending") {
        actionsHTML = `
          <button class="btn-edit" onclick="updateServiceRequest('${r.id}', 'In Progress')">🔄 In Progress</button>
          <button class="btn-paid" onclick="updateServiceRequest('${r.id}', 'Done')">✅ Done</button>
        `;
      } else if (r.status === "In Progress") {
        actionsHTML = `<button class="btn-paid" onclick="updateServiceRequest('${r.id}', 'Done')">✅ Mark Done</button>`;
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

  document.getElementById("totalServiceReqs").textContent = requests.length;
  document.getElementById("pendingServiceReqs").textContent = requests.filter(
    (r) => r.status === "Pending",
  ).length;
  document.getElementById("inProgressServiceReqs").textContent =
    requests.filter((r) => r.status === "In Progress").length;
  document.getElementById("doneServiceReqs").textContent = requests.filter(
    (r) => r.status === "Done",
  ).length;

  const pending = requests.filter((r) => r.status === "Pending").length;
  const badge = document.getElementById("serviceRequestBadge");
  if (pending > 0) {
    badge.style.display = "inline-block";
    badge.textContent = pending;
  } else {
    badge.style.display = "none";
  }
}

async function updateServiceRequest(id, status) {
  try {
    await apiRequest(`/service-requests/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    await loadServiceRequests();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

async function saveSpace() {
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
  try {
    if (id) {
      await apiRequest(`/spaces/${id}`, {
        method: "PUT",
        body: JSON.stringify({ floor, room, size, status, price }),
      });
    } else {
      await apiRequest("/spaces", {
        method: "POST",
        body: JSON.stringify({ floor, room, size, status, price }),
      });
    }
    clearSpaceForm();
    await loadSpaces();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

function renderSpaces() {
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
        <td>$${parseFloat(s.price).toFixed(2)}/month</td>
        <td>${statusHTML}</td>
        <td>
          <button class="btn-edit" onclick="editSpace('${s.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteSpace('${s.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function editSpace(id) {
  const s = spaces.find((s) => s.id == id);
  document.getElementById("spaceId").value = s.id;
  document.getElementById("spaceFloor").value = s.floor;
  document.getElementById("spaceRoom").value = s.room;
  document.getElementById("spaceSize").value = s.size;
  document.getElementById("spaceStatus").value = s.status;
  document.getElementById("spacePrice").value =
    "$" + parseFloat(s.price).toFixed(2) + "/month";
}

async function deleteSpace(id) {
  if (!confirm("Are you sure you want to delete this space?")) return;
  try {
    await apiRequest(`/spaces/${id}`, { method: "DELETE" });
    await loadSpaces();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

function clearSpaceForm() {
  document.getElementById("spaceId").value = "";
  document.getElementById("spaceFloor").value = "";
  document.getElementById("spaceRoom").value = "";
  document.getElementById("spaceSize").value = "";
  document.getElementById("spaceStatus").value = "Available";
  document.getElementById("spacePrice").value = "";
}

async function saveExpense() {
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

  try {
    if (id) {
      await apiRequest(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          reason,
          amount,
          date,
          period,
          dueDate,
          dueDateRaw,
        }),
      });
    } else {
      await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify({
          name,
          reason,
          amount,
          date,
          period,
          dueDate,
          dueDateRaw,
        }),
      });
    }
    clearExpenseForm();
    await loadExpenses();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

function renderExpenses() {
  const table = document.getElementById("expensesTable");
  table.innerHTML = "";

  if (expenses.length === 0) {
    table.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#999;padding:20px;">No expenses recorded yet</td></tr>`;
  } else {
    [...expenses].reverse().forEach((e) => {
      let countdownHTML = "—";
      if (e.dueDateRaw) {
        const due = new Date(e.dueDateRaw);
        const today = new Date();
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diff > 0)
          countdownHTML = `<span style="color:#22c55e;font-weight:bold;">⏳ ${diff} days left</span>`;
        else if (diff === 0)
          countdownHTML = `<span style="color:#f97316;font-weight:bold;">⚠️ Due Today!</span>`;
        else
          countdownHTML = `<span style="color:#e53e3e;font-weight:bold;">🔴 Overdue by ${Math.abs(diff)} days</span>`;
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
            <button class="btn-edit" onclick="editExpense('${e.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteExpense('${e.id}')">Delete</button>
          </td>
        </tr>
      `;
    });
  }

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  document.getElementById("totalExpenses").textContent = "$" + total.toFixed(2);
  document.getElementById("totalExpenseRecords").textContent = expenses.length;
}

function editExpense(id) {
  const e = expenses.find((e) => e.id == id);
  document.getElementById("expenseId").value = e.id;
  document.getElementById("expenseName").value = e.name;
  document.getElementById("expenseReason").value = e.reason;
  document.getElementById("expenseAmount").value = e.amount;
  document.getElementById("expenseDate").value = e.date;
  document.getElementById("expensePeriod").value = e.period || "";
}

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  try {
    await apiRequest(`/expenses/${id}`, { method: "DELETE" });
    await loadExpenses();
  } catch (e) {
    alert("❌ " + e.message);
  }
}

function clearExpenseForm() {
  document.getElementById("expenseId").value = "";
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseReason").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDate").value = "";
  document.getElementById("expensePeriod").value = "";
}
