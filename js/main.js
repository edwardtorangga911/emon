/**
 * Edward Torangga - Modern Portfolio Main JavaScript
 */

// ========== TAB NAVIGATION ==========
function openTab(evt, tabName) {
  const tabPanels = document.getElementsByClassName("tab-content-panel");
  for (let i = 0; i < tabPanels.length; i++) {
    tabPanels[i].style.display = "none";
    tabPanels[i].classList.remove("active");
  }

  const tabLinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
  }

  const targetPanel = document.getElementById(tabName);
  if (targetPanel) {
    targetPanel.style.display = "block";
    targetPanel.classList.add("active");
  }

  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add("active");
  } else {
    const link = document.querySelector(`.tab-link[onclick*="'${tabName}'"]`);
    if (link) link.classList.add("active");
  }

  // Animate skill bars if Skills tab opened
  if (tabName === "Skills") {
    setTimeout(animateSkillBars, 100);
  }
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, icon = "fas fa-check-circle") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// ========== COPY TO CLIPBOARD ==========
function copyToClipboard(text, successMsg = "Tersalin ke clipboard!") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, "fas fa-clipboard-check");
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const input = document.createElement("textarea");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
  showToast(successMsg, "fas fa-clipboard-check");
}

// ========== DARK MODE TOGGLE ==========
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");

  const icons = document.querySelectorAll(".dark-mode-toggle i");
  icons.forEach((icon) => {
    icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  });

  showToast(isDark ? "Mode Gelap Diaktifkan" : "Mode Terang Diaktifkan", isDark ? "fas fa-moon" : "fas fa-sun");
}

// ========== LOAD PROJECTS ==========
async function loadProjects() {
  try {
    const response = await fetch("/data/projects.json");
    if (!response.ok) return;
    const projects = await response.json();

    const container = document.getElementById("Portfolio");
    if (!container) return;

    let html = `
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-briefcase"></i> Showcase Portfolio</h2>
        <p class="section-desc">Kumpulan proyek web, aplikasi, dan infrastruktur sistem yang telah dibangun.</p>
      </div>
      <div class="projects-grid">
    `;

    projects.forEach((project) => {
      const demoBtn = project.url && project.url !== "#"
        ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer" class="btn-card"><i class="fas fa-external-link-alt"></i> Buka Demo</a>`
        : "";
      const ghBtn = project.github && project.github !== "#"
        ? `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn-card"><i class="fab fa-github"></i> Repository</a>`
        : "";

      html += `
        <div class="project-card">
          <div class="project-image-wrap">
            <img src="${project.image}" alt="${project.title}" class="project-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'">
          </div>
          <div class="project-info">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tech">
              ${project.technologies.map(t => `<span class="tech-tag">${t}</span>`).join("")}
            </div>
            <div class="project-actions">
              ${demoBtn}
              ${ghBtn}
            </div>
          </div>
        </div>
      `;
    });

    html += "</div>";
    container.innerHTML = html;
  } catch (err) {
    console.error("Error loading projects:", err);
  }
}

// ========== LOAD SKILLS ==========
async function loadSkills() {
  try {
    const response = await fetch("/data/skills.json");
    if (!response.ok) return;
    const categories = await response.json();

    const container = document.getElementById("Skills");
    if (!container) return;

    let html = `
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-layer-group"></i> Kemampuan Teknis</h2>
        <p class="section-desc">Keahlian dan penguasaan teknologi dalam pengembangan web dan infrastruktur jaringan.</p>
      </div>
      <div class="skills-wrapper">
    `;

    categories.forEach((cat) => {
      html += `
        <div class="skill-category-box">
          <div class="skill-category-header">
            <i class="${cat.icon}"></i>
            <span>${cat.category}</span>
          </div>
          <div class="skill-list">
      `;

      cat.skills.forEach((skill) => {
        html += `
          <div class="skill-item">
            <div class="skill-meta">
              <span>${skill.name}</span>
              <span class="skill-pct">${skill.level}%</span>
            </div>
            <div class="skill-track">
              <div class="skill-fill" style="width: 0%" data-level="${skill.level}%"></div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += "</div>";
    container.innerHTML = html;
  } catch (err) {
    console.error("Error loading skills:", err);
  }
}

function animateSkillBars() {
  const bars = document.querySelectorAll(".skill-fill");
  bars.forEach((bar) => {
    bar.style.width = bar.getAttribute("data-level") || "0%";
  });
}

// ========== WHATSAPP CONTACT FORM ==========
function handleContactForm(event) {
  event.preventDefault();

  const name = document.getElementById("contactName")?.value || "";
  const email = document.getElementById("contactEmail")?.value || "";
  const topic = document.getElementById("contactTopic")?.value || "Diskusi Proyek";
  const message = document.getElementById("contactMessage")?.value || "";

  const text = `Halo Mas Edward,\n\nNama: ${name}\nEmail: ${email}\nKeperluan: ${topic}\n\nPesan:\n${message}`;
  const whatsappUrl = `https://wa.me/6289516236789?text=${encodeURIComponent(text)}`;

  window.open(whatsappUrl, "_blank");
  showToast("Membuka WhatsApp...", "fab fa-whatsapp");
  event.target.reset();
}

// ========== CV MODAL HANDLER ==========
function handleCvDownload(event) {
  if (event) event.preventDefault();
  showToast("CV terbaru dapat diminta langsung via WhatsApp atau Email", "fas fa-file-invoice");
  setTimeout(() => {
    window.open("https://wa.me/6289516236789?text=Halo%20Mas%20Edward,%20saya%20tertarik%20melihat%20CV%20terbaru%20Anda.", "_blank");
  }, 800);
}

// ========== SERVICE WORKER ==========
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", async () => {
  // Check Dark Mode
  const darkMode = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (darkMode === "enabled" || (!darkMode && prefersDark)) {
    document.body.classList.add("dark-mode");
    const icons = document.querySelectorAll(".dark-mode-toggle i");
    icons.forEach((icon) => {
      icon.className = "fas fa-sun";
    });
  }

  // Update Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Load content
  await Promise.all([
    typeof loadApps === "function" ? loadApps() : Promise.resolve(),
    loadProjects(),
    loadSkills(),
  ]);

  // Open default tab
  const defaultTab = document.getElementById("defaultOpen");
  if (defaultTab) {
    defaultTab.click();
  } else {
    openTab(null, "Profil");
  }

  // Particle configuration if present
  if (typeof particlesJS !== "undefined" && typeof initParticles === "function") {
    initParticles();
  }
});
