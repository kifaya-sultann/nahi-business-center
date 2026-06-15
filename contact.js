window.addEventListener("load", () => {
  const phone = localStorage.getItem("bizPhone") || "Not set yet";
  const email = localStorage.getItem("bizEmail") || "Not set yet";
  const telegram = localStorage.getItem("bizTelegram") || "#";

  // Phone — opens keypad
  const phoneEl = document.getElementById("contactPhone");
  phoneEl.href = "tel:" + phone;
  phoneEl.textContent = phone;

  // Email — opens email app
  const emailEl = document.getElementById("contactEmail");
  emailEl.href = "https://mail.google.com/mail/?view=cm&to=" + email;
  emailEl.target = "_blank";
  emailEl.textContent = email;

  // Telegram — opens Telegram
  const telegramEl = document.getElementById("contactTelegram");
  telegramEl.href = telegram;
  telegramEl.textContent = telegram !== "#" ? "Open Telegram" : "Not set yet";

  // Location — opens Google Maps
  document.getElementById("contactLocation").href =
    "https://www.google.com/maps/search/Adama+Ethiopia";
});
