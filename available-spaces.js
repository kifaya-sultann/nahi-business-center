// ==========================================
// 1. API HELPER FUNCTION
// ==========================================
// This handles connecting to your friend's backend
async function apiRequest(endpoint) {
  // FIXED URL: cwhx (NOT cwfx)
  const baseUrl = "https://rental-backend-cwhx.onrender.com/api";

  try {
    const response = await fetch(`${baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error; // Pass the error up so the main code can handle it
  }
}

// ==========================================
// 2. HELPER TO HANDLE DIFFERENT DATA FORMATS
// ==========================================
// In case the backend returns { spaces: [...] } instead of just [...]
function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.spaces)) return data.spaces;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// ==========================================
// 3. MAIN PAGE LOGIC
// ==========================================
window.addEventListener("load", async () => {
  const container = document.getElementById("availableSpaces");
  const filterContainer = document.getElementById("floorFilters");

  // Show a loading message
  container.innerHTML = `<div class="no-spaces">Loading available spaces...</div>`;

  let spaces = [];
  try {
    // Fetch the data from the backend
    const rawData = await apiRequest("/spaces");

    // Extract the array, no matter how the backend sends it
    spaces = extractArray(rawData);
  } catch (err) {
    console.error("Failed to load spaces:", err);
    container.innerHTML = `<div class="no-spaces">Unable to load spaces right now. Please try again later or <a href="contact.html" style="color:#22c55e;">contact us</a>.</div>`;
    return;
  }

  // Filter only the available ones
  const available = spaces.filter((s) => s.status === "Available");

  // If none are available
  if (available.length === 0) {
    container.innerHTML = `<div class="no-spaces">No available spaces at the moment. Please check back later or <a href="contact.html" style="color:#22c55e;">contact us</a>.</div>`;
    return;
  }

  // Get unique floors for the filter buttons
  const floors = [...new Set(available.map((s) => s.floor))].sort();

  // Build the filter buttons
  filterContainer.innerHTML = `
    <button class="filter-btn active" onclick="filterFloor('all')">All</button>
    ${floors.map((f) => `<button class="filter-btn" onclick="filterFloor(${f})">Floor ${f}</button>`).join("")}
  `;

  // Render all spaces initially
  renderSpaces(available);

  // ==========================================
  // 4. FILTER FUNCTION
  // ==========================================
  window.filterFloor = function (floor) {
    // Update active button style
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");

    // Filter and render
    const filtered =
      floor === "all" ? available : available.filter((s) => s.floor === floor);
    renderSpaces(filtered);
  };

  // ==========================================
  // 5. RENDER FUNCTION
  // ==========================================
  function renderSpaces(list) {
    container.innerHTML = "";
    if (list.length === 0) {
      container.innerHTML = `<div class="no-spaces">No spaces available on this floor.</div>`;
      return;
    }
    list.forEach((s) => {
      container.innerHTML += `
        <div class="space-card">
          <div class="space-card-header">
            <span class="space-card-title">Floor ${s.floor}</span>
            <span class="space-badge-available">✅ Available</span>
          </div>
          <div class="space-card-details">
            <div class="space-detail">
              <span>Size</span>
              <span>${s.size || "N/A"} m2</span>
            </div>
          </div>
          <a href="contact.html" class="space-request-btn">Contact Us →</a>
        </div>
      `;
    });
  }
});
