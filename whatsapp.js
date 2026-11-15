/**
 * Bodo Aronai - WhatsApp Click-to-Chat Integration
 * Pure frontend WhatsApp Click-to-Chat without backend dependencies.
 */

const WHATSAPP_PHONE_NUMBER = "918798174261";

function getWhatsAppGeneralUrl() {
  const message = "Hello Team, I have an inquiry regarding products.";
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

function getWhatsAppProductUrl(productName) {
  const message = `Hello Team, I am interested in the ${productName} product. Could you please share more details?`;
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

function initWhatsApp() {
  // If a floating WhatsApp button already exists, hook it up; otherwise create it
  let floatBtn = document.querySelector(".whatsapp-floating-btn");
  if (!floatBtn) {
    floatBtn = document.createElement("a");
    floatBtn.className = "whatsapp-floating-btn";
    floatBtn.target = "_blank";
    floatBtn.rel = "noopener noreferrer";
    floatBtn.setAttribute("aria-label", "Contact us on WhatsApp");
    floatBtn.title = "Chat with us on WhatsApp";

    // Clean inline SVG for WhatsApp
    floatBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.9C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.57 14.37C16.32 14.24 15.1 13.64 14.87 13.56C14.64 13.47 14.48 13.43 14.31 13.68C14.15 13.93 13.68 14.48 13.54 14.65C13.4 14.81 13.25 14.83 13 14.71C12.75 14.58 11.95 14.32 11 13.48C10.26 12.82 9.76 12.01 9.61 11.76C9.47 11.51 9.6 11.38 9.72 11.26C9.83 11.15 9.97 10.97 10.1 10.82C10.22 10.67 10.26 10.56 10.34 10.4C10.42 10.23 10.38 10.09 10.32 9.97C10.26 9.84 9.76 8.63 9.56 8.13C9.36 7.65 9.15 7.71 9 7.71C8.86 7.7 8.7 7.7 8.53 7.7C8.36 7.7 8.09 7.76 7.86 8.01C7.63 8.26 7 8.85 7 10.05C7 11.25 7.88 12.41 8 12.57C8.13 12.74 9.72 15.19 12.16 16.24C12.74 16.49 13.19 16.64 13.55 16.75C14.13 16.94 14.67 16.91 15.09 16.85C15.56 16.78 16.53 16.26 16.73 15.69C16.93 15.12 16.93 14.64 16.87 14.54C16.82 14.44 16.66 14.38 16.41 14.25L16.57 14.37Z"/>
      </svg>
    `;

    const heroSection = document.querySelector(".hero");
    if (heroSection) {
      // Append to hero for mobile positioning requirements, styles handle responsive placement
      heroSection.appendChild(floatBtn);
    } else {
      document.body.appendChild(floatBtn);
    }
  }

  floatBtn.href = getWhatsAppGeneralUrl();
}

document.addEventListener("DOMContentLoaded", initWhatsApp);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initWhatsApp();
}
