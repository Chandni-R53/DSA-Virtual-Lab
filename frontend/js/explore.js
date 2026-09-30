// ==========================================================
// Explore DSA — Client Controller
// Loads data/mock-dsa.json and handles Landing/Concept state,
// dynamic topic card generation, collapsible sidebar accordions,
// search filtering, and concept content rendering.
// ==========================================================

const DATA_URL = "data/mock-dsa.json";
const INITIAL_CARD_LIMIT = 9; // Shows 9 cards initially on landing; "View All Topics" expands to 12

let dsaData = null;                 // Full loaded dataset
let activeConceptId = "arrays";    // Default concept when opening
let isAllTopicsExpanded = false;   // Toggle state for "View All Topics"
const expandedCategories = new Set(); // Set of currently expanded category IDs

// Category icons map (Subtle SVG markers in graphite/lime theme)
const CATEGORY_ICONS = {
  foundations: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  "arrays-strings": `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>`,
  "searching-sorting": `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  "linked-lists": `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`,
  "stack-queue": `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/></svg>`,
  hashing: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  trees: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><line x1="12" y1="8" x2="6" y2="15"/><line x1="12" y1="8" x2="18" y2="15"/></svg>`,
  graphs: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="7.5" y1="7.5" x2="16.5" y2="7.5"/><line x1="6.5" y1="8.5" x2="10.5" y2="15.5"/><line x1="17.5" y1="8.5" x2="13.5" y2="15.5"/></svg>`,
  recursion: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>`,
  greedy: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polygon points="12 8 8 12 12 16 16 12 12 8"/></svg>`,
  "dynamic-programming": `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  backtracking: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`
};

// DOM References
const landingEl = document.getElementById("exploreLanding");
const conceptViewEl = document.getElementById("conceptView");
const topicGridEl = document.getElementById("topicGrid");
const landingSearchEl = document.getElementById("landingSearch");
const landingSearchClearBtn = document.getElementById("landingSearchClear");
const viewAllTopicsBtn = document.getElementById("viewAllTopicsBtn");
const viewAllTopicsLabel = document.getElementById("viewAllTopicsLabel");

const sidebarEl = document.getElementById("sidebar");
const sidebarNavEl = document.getElementById("sidebarNav");
const sidebarSearchEl = document.getElementById("sidebarSearch");
const sidebarSearchClearBtn = document.getElementById("sidebarSearchClear");
const sidebarToggleBtn = document.getElementById("sidebarToggle");
const sidebarToggleLabel = document.getElementById("sidebarToggleLabel");

const backBtn = document.getElementById("backToTopics");
const conceptContentEl = document.getElementById("conceptContent");

init();

async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    dsaData = await res.json();
  } catch (err) {
    topicGridEl.innerHTML = `
      <div class="topic-grid-empty">
        <p><strong>Failed to load DSA content.</strong></p>
        <p style="margin-top: 6px; font-size: 0.85rem;">Please ensure you are viewing this page through a local HTTP server (e.g. VS Code Live Server).</p>
      </div>`;
    console.error("Failed to load", DATA_URL, err);
    return;
  }

  // Open the category of the default concept initially
  const initialConcept = findConcept(activeConceptId) || { category: dsaData.categories[0] };
  if (initialConcept && initialConcept.category) {
    expandedCategories.add(initialConcept.category.id);
  }

  renderTopicGrid(dsaData.categories);
  renderSidebar(dsaData.categories);
  wireEvents();
}

// ==========================================================
// DATA LOOKUP HELPERS
// ==========================================================

function findConcept(conceptId) {
  if (!dsaData || !dsaData.categories) return null;
  for (const category of dsaData.categories) {
    const concept = category.concepts.find((c) => c.id === conceptId);
    if (concept) return { category, concept };
  }
  return null;
}

// ==========================================================
// STATE 1: EXPLORE LANDING
// ==========================================================

function renderTopicGrid(categories, filterQuery = "") {
  const query = filterQuery.trim().toLowerCase();

  // Search matches category title, concept titles, or example concepts
  const matchingCategories = categories.filter((cat) => {
    if (!query) return true;
    const titleMatch = cat.title.toLowerCase().includes(query);
    const conceptMatch = cat.concepts.some(
      (c) => c.title.toLowerCase().includes(query) || (c.type && c.type.toLowerCase().includes(query))
    );
    return titleMatch || conceptMatch;
  });

  if (matchingCategories.length === 0) {
    topicGridEl.innerHTML = `
      <div class="topic-grid-empty">
        <p>No topics match "<strong>${escapeHtml(filterQuery)}</strong>".</p>
        <p style="margin-top: 6px; font-size: 0.85rem; color: var(--ink-faint);">Try searching for "Arrays", "Binary Search", "Trees", or "Graph".</p>
      </div>`;
    return;
  }

  // When searching, display all matching items; otherwise respect the initial 9 limit unless expanded
  const displayLimit = query || isAllTopicsExpanded ? matchingCategories.length : INITIAL_CARD_LIMIT;
  const categoriesToShow = matchingCategories.slice(0, displayLimit);

  // Update button text and state
  if (viewAllTopicsBtn && viewAllTopicsLabel) {
    if (query) {
      viewAllTopicsBtn.style.display = "none";
    } else {
      viewAllTopicsBtn.style.display = "inline-flex";
      if (isAllTopicsExpanded) {
        viewAllTopicsLabel.textContent = `Showing All (${categories.length})`;
      } else {
        viewAllTopicsLabel.textContent = `View All Topics (${categories.length})`;
      }
    }
  }

  topicGridEl.innerHTML = categoriesToShow
    .map((cat) => {
      const iconSvg = CATEGORY_ICONS[cat.id] || `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>`;

      // Determine 2-3 examples to show on the card
      const examples = cat.exampleConcepts && cat.exampleConcepts.length > 0
        ? cat.exampleConcepts.slice(0, 3)
        : cat.concepts.slice(0, 3).map((c) => c.title);
      const examplesFormatted = escapeHtml(examples.join(" · "));

      // Concept-count badge removed from the card
      return `
        <button class="topic-card" data-category-id="${escapeHtml(cat.id)}" type="button" aria-label="Explore ${escapeHtml(cat.title)}">
          <div class="topic-card-top">
            <div class="topic-card-icon" aria-hidden="true">${iconSvg}</div>
          </div>
          <div>
            <h3 class="topic-card-title">${escapeHtml(cat.title)}</h3>
            <div class="topic-card-examples">${examplesFormatted}</div>
          </div>
          <div class="topic-card-footer">
            <span class="topic-card-action">Explore <span aria-hidden="true">→</span></span>
          </div>
        </button>
      `;
    })
    .join("");

  // Attach click listener on each card
  topicGridEl.querySelectorAll(".topic-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = card.dataset.categoryId;
      const category = dsaData.categories.find((c) => c.id === categoryId);
      if (category && category.concepts.length > 0) {
        expandedCategories.add(category.id);
        showConceptView(category.concepts[0].id);
      }
    });
  });
}

// ==========================================================
// STATE 2: SIDEBAR (COMPLETE STRUCTURE, COLLAPSIBLE ACCORDION)
// ==========================================================

function renderSidebar(categories, filterQuery = "") {
  const query = filterQuery.trim().toLowerCase();

  const groupsHtml = categories
    .map((cat) => {
      const matchingConcepts = cat.concepts.filter((c) =>
        c.title.toLowerCase().includes(query) || (c.type && c.type.toLowerCase().includes(query))
      );

      // Hide category if search has no matches within it
      if (query && matchingConcepts.length === 0) return "";

      const conceptsToShow = query ? matchingConcepts : cat.concepts;
      const isOpen = query ? true : expandedCategories.has(cat.id);

      const linksHtml = conceptsToShow
        .map((concept) => {
          const isActive = concept.id === activeConceptId;
          return `
            <button
              class="sidebar-concept-link${isActive ? " active" : ""}"
              data-concept-id="${escapeHtml(concept.id)}"
              type="button"
            >
              <span>${escapeHtml(concept.title)}</span>
              <span class="link-dot" aria-hidden="true"></span>
            </button>
          `;
        })
        .join("");

      // Count badge removed — only the arrow icon remains on the right
      return `
        <div class="sidebar-category${isOpen ? " open" : ""}" data-cat-id="${escapeHtml(cat.id)}">
          <button class="sidebar-category-header" type="button" aria-expanded="${isOpen}">
            <div class="sidebar-cat-left">
              <span class="sidebar-cat-title">${escapeHtml(cat.title)}</span>
            </div>
            <div class="sidebar-cat-right">
              <span class="sidebar-cat-chevron" aria-hidden="true">▸</span>
            </div>
          </button>
          <div class="sidebar-concept-list">
            ${linksHtml}
          </div>
        </div>
      `;
    })
    .join("");

  sidebarNavEl.innerHTML = groupsHtml || `<p class="sidebar-empty">No topics match "${escapeHtml(filterQuery)}".</p>`;

  // Bind accordion toggles
  sidebarNavEl.querySelectorAll(".sidebar-category-header").forEach((headerBtn) => {
    headerBtn.addEventListener("click", () => {
      const categoryWrapper = headerBtn.closest(".sidebar-category");
      const catId = categoryWrapper.dataset.catId;
      const isCurrentlyOpen = categoryWrapper.classList.contains("open");

      if (isCurrentlyOpen) {
        categoryWrapper.classList.remove("open");
        headerBtn.setAttribute("aria-expanded", "false");
        expandedCategories.delete(catId);
      } else {
        categoryWrapper.classList.add("open");
        headerBtn.setAttribute("aria-expanded", "true");
        expandedCategories.add(catId);
      }
    });
  });

  // Bind concept item links
  sidebarNavEl.querySelectorAll(".sidebar-concept-link").forEach((link) => {
    link.addEventListener("click", () => {
      const conceptId = link.dataset.conceptId;
      renderConcept(conceptId);
      closeSidebarOnMobile();
    });
  });
}

function updateActiveSidebarLink(conceptId, categoryId) {
  // Ensure the parent category is open in the accordion
  if (categoryId) {
    expandedCategories.add(categoryId);
    const catGroup = sidebarNavEl.querySelector(`.sidebar-category[data-cat-id="${categoryId}"]`);
    if (catGroup && !catGroup.classList.contains("open")) {
      catGroup.classList.add("open");
      const headerBtn = catGroup.querySelector(".sidebar-category-header");
      if (headerBtn) headerBtn.setAttribute("aria-expanded", "true");
    }
  }

  // Update .active class on links without re-rendering the whole DOM (preserves sidebar scroll)
  sidebarNavEl.querySelectorAll(".sidebar-concept-link").forEach((btn) => {
    if (btn.dataset.conceptId === conceptId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// ==========================================================
// STATE TOGGLING: LANDING <--> CONCEPT VIEW
// ==========================================================

function showConceptView(conceptId) {
  landingEl.hidden = true;
  conceptViewEl.hidden = false;
  renderConcept(conceptId || activeConceptId || "arrays");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showLandingView() {
  conceptViewEl.hidden = true;
  landingEl.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ==========================================================
// CONCEPT CONTENT RENDERING (POLISHED MODULAR CARDS)
// ==========================================================

function renderConcept(conceptId) {
  const found = findConcept(conceptId);
  if (!found) return;

  activeConceptId = conceptId;
  const { category, concept } = found;

  // Highlight active link in sidebar and expand category
  updateActiveSidebarLink(conceptId, category.id);

  // Render Visual Example Box (Specialized for Arrays and indexed sequences)
  let exampleHtml = "";
  if (concept.example) {
    const desc = concept.example.description ? `<p class="visual-example-desc">${escapeHtml(concept.example.description)}</p>` : "";

    // Check if indices or values are present for visual array rendering
    if (concept.example.values && Array.isArray(concept.example.values)) {
      const indices = concept.example.indices || concept.example.values.map((_, i) => i);
      const highlightIdx = typeof concept.example.highlightIndex === "number" ? concept.example.highlightIndex : -1;

      exampleHtml = `
        <div class="visual-example-container">
          ${desc}
          <div class="array-visual-grid">
            <div class="array-indices-row">
              ${indices.map((idx) => `<div class="array-index-cell">idx ${escapeHtml(String(idx))}</div>`).join("")}
            </div>
            <div class="array-boxes-row">
              ${concept.example.values
                .map(
                  (val, i) => `
                <div class="array-value-cell${i === highlightIdx ? " highlight" : ""}">
                  ${escapeHtml(String(val))}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          <div class="array-legend">
            <span class="legend-dot"></span>
            <span>Contiguous indexed memory cells (sequential access)</span>
          </div>
        </div>
      `;
    } else {
      exampleHtml = desc;
    }
  }

  // Render Operations Table
  let operationsHtml = "";
  if (concept.operations && concept.operations.length > 0) {
    operationsHtml = `
      <div class="concept-card">
        <div class="concept-card-title">
          <span class="card-title-icon" aria-hidden="true">⚡</span> Common Operations
        </div>
        <div class="ops-table-wrap">
          <table class="ops-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Complexity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${concept.operations
                .map(
                  (op) => `
                <tr>
                  <td class="op-name">${escapeHtml(op.name)}</td>
                  <td class="op-complexity">${escapeHtml(op.complexity)}</td>
                  <td>${escapeHtml(op.description)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Render Pseudocode / Code Idea Box
  let pseudocodeHtml = "";
  if (concept.pseudocode && concept.pseudocode.length > 0) {
    pseudocodeHtml = `
      <div class="concept-card">
        <div class="concept-card-title">
          <span class="card-title-icon" aria-hidden="true">⌨</span> Pseudocode / Code Idea
        </div>
        <div class="pseudocode-panel">
          ${concept.pseudocode
            .map((line) => {
              const isComment = line.trim().startsWith("//");
              return `<div class="pseudocode-line${isComment ? " comment" : ""}">${escapeHtml(line)}</div>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // Inject full concept layout
  // Header: title on the left, category pill on the right (no top green line, no breadcrumbs)
  conceptContentEl.innerHTML = `
    <!-- Concept Header Card -->
    <div class="concept-header-card">
      <div class="concept-header-top">
        <h1>${escapeHtml(concept.title)}</h1>
        <span class="concept-badge">
          <span aria-hidden="true">◆</span> ${escapeHtml(concept.type || "Concept")} · ${escapeHtml(category.title)}
        </span>
      </div>
      <p class="concept-header-overview">${escapeHtml(concept.overview || "")}</p>
    </div>

    <!-- Why / When to Use -->
    <div class="concept-card">
      <div class="concept-card-title">
        <span class="card-title-icon" aria-hidden="true">🎯</span> Why &amp; When to Use
      </div>
      <p>${escapeHtml(concept.whyUse || "")}</p>
    </div>

    <!-- How It Works -->
    <div class="concept-card">
      <div class="concept-card-title">
        <span class="card-title-icon" aria-hidden="true">⚙</span> How It Works
      </div>
      <ul class="concept-steps-list">
        ${(concept.howItWorks || [])
          .map(
            (step, i) => `
          <li class="concept-step-item">
            <span class="concept-step-num">${i + 1}</span>
            <span>${escapeHtml(step)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>

    <!-- Visual Example -->
    <div class="concept-card">
      <div class="concept-card-title">
        <span class="card-title-icon" aria-hidden="true">🔍</span> Visual Example &amp; State
      </div>
      ${exampleHtml}
    </div>

    <!-- Operations Table -->
    ${operationsHtml}

    <!-- Time & Space Complexity -->
    <div class="concept-card">
      <div class="concept-card-title">
        <span class="card-title-icon" aria-hidden="true">⏱</span> Time &amp; Space Complexity
      </div>
      <div class="complexity-grid">
        <div class="complexity-card-inner">
          <span>Time Complexity</span>
          <strong>${escapeHtml(concept.complexity ? concept.complexity.time : "Varies")}</strong>
        </div>
        <div class="complexity-card-inner">
          <span>Space Complexity</span>
          <strong>${escapeHtml(concept.complexity ? concept.complexity.space : "Varies")}</strong>
        </div>
      </div>
    </div>

    <!-- Pseudocode -->
    ${pseudocodeHtml}

    <!-- Key Takeaways -->
    <div class="concept-card">
      <div class="concept-card-title">
        <span class="card-title-icon" aria-hidden="true">💡</span> Key Takeaways
      </div>
      <ul class="takeaways-list">
        ${(concept.keyTakeaways || [])
          .map(
            (item) => `
          <li>
            <span class="takeaway-bullet" aria-hidden="true">✓</span>
            <span>${escapeHtml(item)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>

    <!-- Common UI Action Buttons -->
    <div class="concept-common-actions">
      <a href="index.html#virtual-lab" class="btn btn-primary">
        <span>Visualize in Virtual Lab</span>
        <span aria-hidden="true">→</span>
      </a>
      <a href="index.html#how-it-helps" class="btn btn-outline">
        <span>Practice Problems</span>
      </a>
    </div>
  `;
}

// ==========================================================
// EVENT WIRING
// ==========================================================

function wireEvents() {
  // Back to Landing
  if (backBtn) {
    backBtn.addEventListener("click", showLandingView);
  }

  // View All Topics Toggle
  if (viewAllTopicsBtn) {
    viewAllTopicsBtn.addEventListener("click", () => {
      isAllTopicsExpanded = !isAllTopicsExpanded;
      renderTopicGrid(dsaData.categories, landingSearchEl.value);
    });
  }

  // Landing Search
  if (landingSearchEl) {
    landingSearchEl.addEventListener("input", (e) => {
      const val = e.target.value;
      if (landingSearchClearBtn) {
        landingSearchClearBtn.hidden = val.length === 0;
      }
      renderTopicGrid(dsaData.categories, val);
    });
  }

  // Clear Landing Search
  if (landingSearchClearBtn) {
    landingSearchClearBtn.addEventListener("click", () => {
      landingSearchEl.value = "";
      landingSearchClearBtn.hidden = true;
      landingSearchEl.focus();
      renderTopicGrid(dsaData.categories, "");
    });
  }

  // Sidebar Search
  if (sidebarSearchEl) {
    sidebarSearchEl.addEventListener("input", (e) => {
      const val = e.target.value;
      if (sidebarSearchClearBtn) {
        sidebarSearchClearBtn.hidden = val.length === 0;
      }
      renderSidebar(dsaData.categories, val);
    });
  }

  // Clear Sidebar Search (custom white × replaces the native blue one)
  if (sidebarSearchClearBtn) {
    sidebarSearchClearBtn.addEventListener("click", () => {
      sidebarSearchEl.value = "";
      sidebarSearchClearBtn.hidden = true;
      sidebarSearchEl.focus();
      renderSidebar(dsaData.categories, "");
    });
  }

  // Mobile Drawer Toggle
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      const isOpen = sidebarEl.classList.toggle("open");
      sidebarToggleBtn.setAttribute("aria-expanded", String(isOpen));
      sidebarToggleLabel.textContent = isOpen ? "Hide Curriculum" : "Topic Navigation";
    });
  }
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 840 && sidebarEl && sidebarToggleBtn) {
    sidebarEl.classList.remove("open");
    sidebarToggleBtn.setAttribute("aria-expanded", "false");
    sidebarToggleLabel.textContent = "Topic Navigation";
  }
}

// Utility: HTML Escaper to prevent structure breaking or XSS
function escapeHtml(str) {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}