// ========== LOAD APPS FROM JSON ==========
async function loadApps() {
    try {
        const response = await fetch('/data/apps.json');
        const apps = await response.json();
        
        const appsContainer = document.getElementById('Apps');
        
        // Group apps by category
        const categories = {};
        apps.forEach(app => {
            if (!categories[app.category]) {
                categories[app.category] = [];
            }
            categories[app.category].push(app);
        });
        
        // Build HTML
        let html = '<div class="apps-container">';
        
        Object.keys(categories).forEach(category => {
            html += `
                <div class="app-category">
                    <h3 class="category-title">
                        <i class="fas fa-folder"></i> ${category}
                    </h3>
                    <div class="apps-grid">
            `;
            
            categories[category].forEach(app => {
                const statusBadge = app.status === 'completed' 
                    ? '<span class="status-badge completed">Completed</span>' 
                    : '<span class="status-badge in-progress">In Progress</span>';
                
                html += `
                    <div class="app-card" data-app-id="${app.id}">
                        <div class="app-image" style="background-image: url('${app.image}')">
                            ${statusBadge}
                        </div>
                        <div class="app-content">
                            <div class="app-header">
                                <i class="${app.icon}"></i>
                                <h4 class="app-name">${app.name}</h4>
                            </div>
                            <p class="app-description">${app.description}</p>
                            <div class="app-tech">
                                ${app.technologies.slice(0, 3).map(tech => 
                                    `<span class="tech-badge">${tech}</span>`
                                ).join('')}
                                ${app.technologies.length > 3 ? `<span class="tech-badge">+${app.technologies.length - 3}</span>` : ''}
                            </div>
                            <div class="app-actions">
                                ${app.url !== '#' ? `<a href="${app.url}" class="app-btn primary" target="_blank" rel="noopener noreferrer">
                                    <i class="fas fa-external-link-alt"></i> Visit
                                </a>` : ''}
                                ${app.github !== '#' ? `<a href="${app.github}" class="app-btn secondary" target="_blank" rel="noopener noreferrer">
                                    <i class="fab fa-github"></i> GitHub
                                </a>` : ''}
                                <button class="app-btn info" onclick="showAppDetail(${app.id})">
                                    <i class="fas fa-info-circle"></i> Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add modal for app details
        html += `
            <div id="appModal" class="modal">
                <div class="modal-content">
                    <span class="modal-close" onclick="closeAppModal()">&times;</span>
                    <div id="appModalBody"></div>
                </div>
            </div>
        `;
        
        appsContainer.innerHTML = html;
        
        // Store apps data globally for modal
        window.appsData = apps;
    } catch (error) {
        console.error('Error loading apps:', error);
    }
}

// ========== SHOW APP DETAIL MODAL ==========
function showAppDetail(appId) {
    const app = window.appsData.find(a => a.id === appId);
    if (!app) return;
    
    const modal = document.getElementById('appModal');
    const modalBody = document.getElementById('appModalBody');
    
    const statusBadge = app.status === 'completed' 
        ? '<span class="status-badge completed">Completed</span>' 
        : '<span class="status-badge in-progress">In Progress</span>';
    
    modalBody.innerHTML = `
        <div class="app-detail">
            <div class="app-detail-header">
                <i class="${app.icon}" style="font-size: 48px; color: var(--primary-color);"></i>
                <div>
                    <h2>${app.name}</h2>
                    <p class="app-year">${app.year} • ${app.category}</p>
                    ${statusBadge}
                </div>
            </div>
            
            <div class="app-detail-image">
                <img src="${app.image}" alt="${app.name}">
            </div>
            
            <div class="app-detail-section">
                <h3><i class="fas fa-info-circle"></i> Description</h3>
                <p>${app.description}</p>
            </div>
            
            <div class="app-detail-section">
                <h3><i class="fas fa-code"></i> Technologies</h3>
                <div class="tech-list">
                    ${app.technologies.map(tech => `<span class="tech-badge-large">${tech}</span>`).join('')}
                </div>
            </div>
            
            <div class="app-detail-section">
                <h3><i class="fas fa-star"></i> Key Features</h3>
                <ul class="features-list">
                    ${app.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                </ul>
            </div>
            
            <div class="app-detail-actions">
                ${app.url !== '#' ? `<a href="${app.url}" class="app-btn primary large" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> Visit Website
                </a>` : ''}
                ${app.github !== '#' ? `<a href="${app.github}" class="app-btn secondary large" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-github"></i> View on GitHub
                </a>` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// ========== CLOSE APP MODAL ==========
function closeAppModal() {
    const modal = document.getElementById('appModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('appModal');
    if (event.target === modal) {
        closeAppModal();
    }
}
