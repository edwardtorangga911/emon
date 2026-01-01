// Main JavaScript for Edward Torangga Profile Website

// ========== TAB NAVIGATION ==========
function openTab(evt, tabName) {
    const tabContent = document.getElementsByClassName("tab-content-panel");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    const tabLinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
    
    // Close mobile menu after selection
    if (window.innerWidth <= 768) {
        toggleMenu();
    }
}

// ========== MOBILE MENU TOGGLE ==========
function toggleMenu() {
    const nav = document.querySelector('.tabs-navigation');
    nav.classList.toggle('show');
}

// ========== RANDOM GRADIENT BACKGROUND ==========
function setRandomGradient() {
    const hero = document.querySelector('.hero-section');
    
    const randomBrightColor = () => {
        const h = Math.floor(Math.random() * 361);
        const s = Math.floor(Math.random() * 30) + 70;
        const l = Math.floor(Math.random() * 15) + 60;
        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const color1 = randomBrightColor();
    const color2 = randomBrightColor();
    const angle = Math.floor(Math.random() * 361);

    hero.style.backgroundImage = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

// ========== DARK MODE TOGGLE ==========
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    
    // Update icon
    const icon = document.querySelector('.dark-mode-toggle i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

// ========== LOAD TOOLS FROM JSON ==========
async function loadTools() {
    try {
        const response = await fetch('/data/tools.json');
        const tools = await response.json();
        
        const toolsContainer = document.getElementById('Tools');
        const categories = {};
        
        // Group tools by category
        tools.forEach(tool => {
            if (!categories[tool.category]) {
                categories[tool.category] = [];
            }
            categories[tool.category].push(tool);
        });
        
        // Build HTML
        let html = '<div class="search-box"><input type="text" id="toolSearch" placeholder="🔍 Cari tools..." onkeyup="searchTools()"></div>';
        
        Object.keys(categories).forEach(category => {
            const categoryIcon = getCategoryIcon(category);
            html += `
                <div class="tool-category">
                    <h3><i class="${categoryIcon}"></i> ${category}</h3>
                    <ul class="tools-list">
            `;
            
            categories[category].forEach(tool => {
                html += `
                    <li>
                        <a href="${tool.url}" target="_blank" rel="noopener noreferrer" data-name="${tool.name.toLowerCase()}" data-desc="${tool.description.toLowerCase()}">
                            <i class="${tool.icon}"></i>
                            <div>
                                <span>${tool.name}</span>
                                <span class="tool-description">${tool.description}</span>
                            </div>
                        </a>
                    </li>
                `;
            });
            
            html += '</ul></div>';
        });
        
        toolsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading tools:', error);
    }
}

function getCategoryIcon(category) {
    const icons = {
        'Jaringan': 'fas fa-network-wired',
        'Development': 'fas fa-code',
        'Design': 'fas fa-palette',
        'Productivity': 'fas fa-tasks'
    };
    return icons[category] || 'fas fa-tools';
}

// ========== SEARCH TOOLS ==========
function searchTools() {
    const input = document.getElementById('toolSearch');
    const filter = input.value.toLowerCase();
    const toolsList = document.querySelectorAll('.tools-list li');
    
    toolsList.forEach(item => {
        const link = item.querySelector('a');
        const name = link.getAttribute('data-name');
        const desc = link.getAttribute('data-desc');
        
        if (name.includes(filter) || desc.includes(filter)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// ========== LOAD PROJECTS FROM JSON ==========
async function loadProjects() {
    try {
        const response = await fetch('/data/projects.json');
        const projects = await response.json();
        
        const projectsContainer = document.getElementById('Portfolio');
        let html = '<div class="projects-grid">';
        
        projects.forEach(project => {
            html += `
                <div class="project-card" onclick="window.open('${project.url}', '_blank')">
                    <img src="${project.image}" alt="${project.title}" class="project-image">
                    <div class="project-info">
                        <h4 class="project-title">${project.title}</h4>
                        <p class="project-description">${project.description}</p>
                        <div class="project-tech">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        projectsContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// ========== LOAD SKILLS FROM JSON ==========
async function loadSkills() {
    try {
        const response = await fetch('/data/skills.json');
        const skillsData = await response.json();
        
        const skillsContainer = document.getElementById('Skills');
        let html = '<div class="skills-container">';
        
        skillsData.forEach(category => {
            html += `
                <div class="skill-category">
                    <h3><i class="${category.icon}"></i> ${category.category}</h3>
            `;
            
            category.skills.forEach(skill => {
                html += `
                    <div class="skill-item">
                        <div class="skill-name">
                            <span>${skill.name}</span>
                            <span>${skill.level}%</span>
                        </div>
                        <div class="skill-bar">
                            <div class="skill-progress" style="width: 0%" data-width="${skill.level}%"></div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        skillsContainer.innerHTML = html;
        
        // Animate skill bars
        setTimeout(() => {
            document.querySelectorAll('.skill-progress').forEach(bar => {
                bar.style.width = bar.getAttribute('data-width');
            });
        }, 100);
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

// ========== WHATSAPP CONTACT FORM ==========
function handleContactForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    const whatsappNumber = '6289516236789';
    const whatsappMessage = `Halo, saya ${name}%0A%0AEmail: ${email}%0A%0APesan:%0A${encodeURIComponent(message)}`;
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    
    window.open(whatsappURL, '_blank');
    
    // Reset form
    event.target.reset();
}

// ========== REGISTER SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Set random gradient background
    setRandomGradient();
    
    // Set year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Check dark mode preference
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('.dark-mode-toggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
    
    // Load dynamic content
    await loadTools();
    await loadProjects();
    await loadSkills();
    
    // Open default tab
    document.getElementById("defaultOpen").click();
    
    // Initialize particles if available
    if (typeof particlesJS !== 'undefined') {
        initParticles();
    }
});
