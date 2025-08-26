const tooltip = document.getElementById("tooltip");
let hoverTimer = null;
let hideTimer = null;
let currentTarget = null;
let tooltipActive = false; // true if tooltip is showing

function showTooltip(el) {
  const text = el.getAttribute("tooltip");
  if (!text) return;

  tooltip.textContent = text;
  tooltip.style.display = "block";

  const rect = el.getBoundingClientRect();
  const tRect = tooltip.getBoundingClientRect();
  const margin = 6;

  // center above
  let left = rect.left + (rect.width - tRect.width) / 2;
  let top = rect.top - tRect.height - margin;

  // if above doesn’t fit, go below
  if (top < 0) top = rect.bottom + margin;

  // clamp horizontally
  if (left < margin) left = margin;
  if (left + tRect.width > window.innerWidth - margin) {
    left = window.innerWidth - tRect.width - margin;
  }

  // clamp vertically
  if (top < margin) top = margin;
  if (top + tRect.height > window.innerHeight - margin) {
    top = window.innerHeight - tRect.height - margin;
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";

  tooltipActive = true;
}

function hideTooltip() {
  tooltip.style.display = "none";
  tooltipActive = false;
}

document.addEventListener("mouseover", e => {
  const el = e.target.closest("[tooltip]");
  if (!el) return;

  clearTimeout(hoverTimer);
  clearTimeout(hideTimer);

  currentTarget = el;

  if (tooltipActive) {
    // tooltip is already showing → show new one instantly
    showTooltip(el);
  } else {
    // wait before showing
    hoverTimer = setTimeout(() => showTooltip(el), 1000);
  }
});

document.addEventListener("mouseout", e => {
  const el = e.target.closest("[tooltip]");
  if (!el) return;

  clearTimeout(hoverTimer);

  // keep tooltip visible a little after leaving
  hideTimer = setTimeout(() => hideTooltip(), 300);
});

// Hide tooltip if the currently-hovered element is removed from the DOM
const removalObserver = new MutationObserver(() => {
  if (currentTarget && !currentTarget.isConnected) {
    clearTimeout(hoverTimer);
    clearTimeout(hideTimer);
    hideTooltip();
    currentTarget = null;
  }
});

// Watch the whole document for removals
removalObserver.observe(document.documentElement, {
  childList: true,
  subtree: true
});

