window.addEventListener("load", () => {
  const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
  const pricePerM2 = parseFloat(localStorage.getItem("pricePerM2")) || 10;
  const container = document.getElementById("availableSpaces");

  const available = spaces.filter((s) => s.status === "Available");

  if (available.length === 0) {
    container.innerHTML = `<div class="no-spaces">No available spaces at the moment. Please check back later or <a href="contact.html" style="color:#22c55e;">contact us</a>.</div>`;
    return;
  }

  available.forEach((s) => {
    const price = parseFloat(s.price) || parseFloat(s.size) * pricePerM2;
    container.innerHTML += `
      <div class="space-card">
        <div class="space-card-header">
          <span class="space-card-title">Floor ${s.floor} — Room ${s.room}</span>
          <span class="space-badge-available">✅ Available</span>
        </div>
        <div class="space-card-details">
          <div class="space-detail">
            <span>Size</span>
            <span>${s.size} m2</span>
          </div>
          <div class="space-detail">
            <span>Price per m2</span>
            <span>$${pricePerM2}/m2</span>
          </div>
          <div class="space-detail">
            <span>Monthly Price</span>
            <span>$${price.toFixed(2)}/month</span>
          </div>
        </div>
        <a href="contact.html" class="space-request-btn">Contact Us →</a>
      </div>
    `;
  });
});
