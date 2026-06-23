window.addEventListener("load", () => {
  const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
  const container = document.getElementById("availableSpaces");
  const filterContainer = document.getElementById("floorFilters");

  const available = spaces.filter((s) => s.status === "Available");

  if (available.length === 0) {
    container.innerHTML = `<div class="no-spaces">No available spaces at the moment. Please check back later or <a href="contact.html" style="color:#22c55e;">contact us</a>.</div>`;
    return;
  }

  // Get unique floors
  const floors = [...new Set(available.map((s) => s.floor))].sort();

  // Build filter buttons
  filterContainer.innerHTML = `
    <button class="filter-btn active" onclick="filterFloor('all')">All</button>
    ${floors.map((f) => `<button class="filter-btn" onclick="filterFloor(${f})">Floor ${f}</button>`).join("")}
  `;

  // Render all spaces
  renderSpaces(available);

  window.filterFloor = function (floor) {
    // Update active button
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");

    // Filter and render
    const filtered =
      floor === "all" ? available : available.filter((s) => s.floor === floor);
    renderSpaces(filtered);
  };

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
              <span>${s.size} m2</span>
            </div>
          </div>
          <a href="contact.html" class="space-request-btn">Contact Us →</a>
        </div>
      `;
    });
  }
});
