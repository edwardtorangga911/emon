/**
 * Apps & Tools Component for Edward Torangga Portfolio
 */

let allAppsData = [];
let currentCategoryFilter = "all";
let currentSearchTerm = "";

// ========== LOAD APPS ==========
async function loadApps() {
  try {
    const response = await fetch("/data/apps.json");
    if (!response.ok) return;
    allAppsData = await response.json();
    renderAppsTab();
  } catch (error) {
    console.error("Error loading apps:", error);
  }
}

// ========== RENDER APPS TAB ==========
function renderAppsTab() {
  const container = document.getElementById("Apps");
  if (!container) return;

  // Extract unique categories
  const categories = ["all", ...new Set(allAppsData.map((a) => a.category))];

  let html = `
    <div class="section-header">
      <h2 class="section-title"><i class="fas fa-cubes"></i> Aplikasi & Solusi Digital</h2>
      <p class="section-desc">Koleksi aplikasi web, game interaktif, tool jaringan, dan sistem mandiri yang siap digunakan.</p>
    </div>

    <!-- Toolbar: Search & Filter -->
    <div class="apps-toolbar">
      <div class="search-box-wrap">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          id="appSearchInput" 
          class="search-input" 
          placeholder="Cari nama aplikasi, teknologi, atau fitur..." 
          oninput="handleAppSearch(this.value)"
        >
      </div>

      <div class="filter-chips">
        ${categories
          .map((cat) => {
            const label = cat === "all" ? "Semua Kategori" : cat;
            const activeClass = cat === currentCategoryFilter ? "active" : "";
            return `
              <button 
                class="filter-chip ${activeClass}" 
                onclick="filterAppsByCategory('${cat}')"
              >
                ${label}
              </button>
            `;
          })
          .join("")}
      </div>
    </div>

    <!-- Apps Grid -->
    <div id="appsGridContainer" class="apps-grid">
      ${renderAppsCards(getFilteredApps())}
    </div>

    <!-- App Detail Modal -->
    <div id="appModal" class="modal" onclick="handleModalBackdropClick(event)">
      <div class="modal-content">
        <button class="modal-close-btn" onclick="closeAppModal()" aria-label="Tutup Detail">
          <i class="fas fa-times"></i>
        </button>
        <div id="appModalBody" class="modal-body"></div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ========== GET FILTERED APPS ==========
function getFilteredApps() {
  return allAppsData.filter((app) => {
    const matchesCat = currentCategoryFilter === "all" || app.category === currentCategoryFilter;
    const term = currentSearchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      app.name.toLowerCase().includes(term) ||
      app.description.toLowerCase().includes(term) ||
      (app.technologies && app.technologies.some((t) => t.toLowerCase().includes(term)));
    return matchesCat && matchesSearch;
  });
}

// ========== RENDER APP CARDS ==========
function renderAppsCards(apps) {
  if (apps.length === 0) {
    return `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p>Tidak ada aplikasi yang cocok dengan pencarian Anda.</p>
      </div>
    `;
  }

  return apps
    .map((app) => {
      const isCompleted = app.status === "completed";
      const statusClass = isCompleted ? "completed" : "in-progress";
      const statusLabel = isCompleted ? "Siap Pakai" : "Pengembangan";

      const demoBtn = app.url && app.url !== "#"
        ? `<a href="${app.url}" target="_blank" rel="noopener noreferrer" class="app-btn primary"><i class="fas fa-play"></i> Buka</a>`
        : "";

      const repoBtn = app.github && app.github !== "#"
        ? `<a href="${app.github}" target="_blank" rel="noopener noreferrer" class="app-btn secondary"><i class="fab fa-github"></i> Git</a>`
        : "";

      return `
        <div class="app-card" data-id="${app.id}">
          <div class="app-image-wrap" style="background-image: url('${app.image}')">
            <div class="app-image-overlay"></div>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="app-content">
            <div class="app-header">
              <div class="app-header-icon"><i class="${app.icon}"></i></div>
              <div>
                <h3 class="app-name">${app.name}</h3>
                <span style="font-size: 11px; color: var(--text-muted);">${app.category} • ${app.year || "2026"}</span>
              </div>
            </div>
            <p class="app-description">${app.description}</p>
            <div class="app-tech">
              ${(app.technologies || []).slice(0, 3).map((t) => `<span class="tech-badge">${t}</span>`).join("")}
              ${app.technologies && app.technologies.length > 3 ? `<span class="tech-badge">+${app.technologies.length - 3}</span>` : ""}
            </div>
            <div class="app-actions">
              ${demoBtn}
              ${repoBtn}
              <button class="app-btn secondary" onclick="showAppDetail(${app.id})"><i class="fas fa-circle-info"></i> Detail</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ========== HANDLERS ==========
function handleAppSearch(term) {
  currentSearchTerm = term;
  updateAppsGrid();
}

function filterAppsByCategory(category) {
  currentCategoryFilter = category;
  
  // Update chip styles
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach((chip) => {
    chip.classList.toggle("active", chip.textContent.trim() === (category === "all" ? "Semua Kategori" : category));
  });

  updateAppsGrid();
}

function updateAppsGrid() {
  const grid = document.getElementById("appsGridContainer");
  if (grid) {
    grid.innerHTML = renderAppsCards(getFilteredApps());
  }
}

// ========== DETAIL MODAL ==========
function showAppDetail(appId) {
  const app = allAppsData.find((a) => a.id === appId);
  if (!app) return;

  const modal = document.getElementById("appModal");
  const modalBody = document.getElementById("appModalBody");
  if (!modal || !modalBody) return;

  const isCompleted = app.status === "completed";
  const statusBadge = isCompleted
    ? `<span class="status-badge completed" style="position:static;">Tersedia & Siap Pakai</span>`
    : `<span class="status-badge in-progress" style="position:static;">Sedang Dikembangkan</span>`;

  modalBody.innerHTML = `
    <div class="modal-header-top">
      <div class="modal-app-icon"><i class="${app.icon}"></i></div>
      <div style="flex:1;">
        <h2 class="modal-app-title">${app.name}</h2>
        <div class="modal-app-meta">Tahun: ${app.year || "2026"} • Kategori: ${app.category}</div>
      </div>
      <div>${statusBadge}</div>
    </div>

    <div class="modal-app-img-wrap">
      <img src="${app.image}" alt="${app.name}">
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title"><i class="fas fa-align-left"></i> Deskripsi Proyek</h3>
      <p style="font-size: 14px; line-height: 1.7; color: var(--text-sub);">${app.description}</p>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title"><i class="fas fa-layer-group"></i> Fitur & Kapabilitas Utama</h3>
      <ul class="modal-features-list">
        ${(app.features || ["Arsitektur responsif", "Optimasi performa", "Dukungan cross-device"])
          .map((f) => `<li><i class="fas fa-check-circle"></i> <span>${f}</span></li>`)
          .join("")}
      </ul>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title"><i class="fas fa-code"></i> Teknologi yang Digunakan</h3>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${(app.technologies || []).map((t) => `<span class="tech-badge" style="font-size:12px; padding:4px 10px;">${t}</span>`).join("")}
      </div>
    </div>

    <div class="modal-actions">
      ${app.url && app.url !== "#" ? `<a href="${app.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex:1;"><i class="fas fa-external-link-alt"></i> Buka Aplikasi</a>` : ""}
      ${app.github && app.github !== "#" ? `<a href="${app.github}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="flex:1;"><i class="fab fa-github"></i> Lihat di GitHub</a>` : ""}
    </div>
  `;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeAppModal() {
  const modal = document.getElementById("appModal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
}

function handleModalBackdropClick(event) {
  if (event.target && event.target.id === "appModal") {
    closeAppModal();
  }
}

// Close on Escape Key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAppModal();
  }
});
