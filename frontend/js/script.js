// ---------- Mobile navigation toggle ----------
const navToggle = document.getElementById("navToggle");
const navbar = document.getElementById("navbar");

navToggle.addEventListener("click", () => {
  const isOpen = navbar.classList.toggle("menu-open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navbar.classList.remove("menu-open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// ---------- Hero lab window playback simulation ----------
// Homepage preview only — the real Virtual Lab page will replace this
// with actual step data fetched from the backend.
const steps = [
  { array: [4, 8, 12, 16, 23, 42], active: 2, low: 0, mid: 2, high: 5, msg: "Comparing 12 with target 23.<br>Since 12 &lt; 23, search in right half." },
  { array: [4, 8, 12, 16, 23, 42], active: 4, low: 3, mid: 4, high: 5, msg: "Comparing 23 with target 23.<br>Match found at index 4." },
];

const arrayEl = document.querySelector(".array-row");
const msgEl = document.querySelector(".lab-msg-box p");
const stepPill = document.querySelector(".lab-step-pill");
const playBtn = document.querySelector(".ctrl-btn-primary");
const nextBtn = document.querySelectorAll(".ctrl-btn-text")[1];
const prevBtn = document.querySelectorAll(".ctrl-btn-text")[0];
const resetBtn = document.querySelector(".ctrl-btn:not(.ctrl-btn-text):not(.ctrl-btn-primary)");

let current = 0;
let timer = null;

function render(index) {
  const step = steps[index];
  arrayEl.innerHTML = "";
  step.array.forEach((value, i) => {
    const cell = document.createElement("div");
    cell.className = "cell" + (i === step.active ? " active" : "");
    const span = document.createElement("span");
    span.textContent = value;
    cell.appendChild(span);
    arrayEl.appendChild(cell);
  });
  msgEl.innerHTML = step.msg;
  if (stepPill) stepPill.textContent = `Step ${index + 1} / ${steps.length}`;
}

function goTo(index) {
  current = (index + steps.length) % steps.length;
  render(current);
}

function stop() {
  clearInterval(timer);
  timer = null;
  playBtn.innerHTML = "▶ Pause".replace("Pause", "Play");
}

if (arrayEl && msgEl) {
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
  if (resetBtn) resetBtn.addEventListener("click", () => { stop(); goTo(0); });

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (timer) { stop(); return; }
      playBtn.textContent = "❚❚ Pause";
      timer = setInterval(() => goTo(current + 1), 1600);
    });
  }

  render(current);
}