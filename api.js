// api.js
const API_URL = "https://rental-backend-cwhx.onrender.com/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error:", {
        status: response.status,
        message: data.message,
      });
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("❌ API Error:", error.message);
    throw error;
  }
}

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

function normalizeId(obj) {
  if (obj && obj.id === undefined && obj._id !== undefined) {
    obj.id = obj._id;
  }
  return obj;
}

function requireAuth(requiredRole) {
  const token = getToken();
  const user = getCurrentUser();
  if (!token || !user) {
    window.location.href = "login.html";
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}
