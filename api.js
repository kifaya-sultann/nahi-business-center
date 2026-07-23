// api.js
const API_URL = "https://rental-backend-cwhx.onrender.com/api";

// Get token from localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Main API request function
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
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
}
function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

// Every object coming back from Mongo may use "_id" instead of "id".
// This normalizes it so the rest of the code can just use obj.id.
function normalizeId(obj) {
  if (obj && obj.id === undefined && obj._id !== undefined) {
    obj.id = obj._id;
  }
  return obj;
}

// Redirect to login if there's no token. Call this at the top of any
// protected dashboard page.
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
