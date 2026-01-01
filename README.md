# Edward Torangga - Portfolio Website

Modern and responsive portfolio website showcasing projects, skills, and tools. Built with vanilla HTML, CSS, and JavaScript with PWA support.

## 🌟 Features

- **Modern Design**: Clean and professional UI with gradient backgrounds and smooth animations
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **PWA Support**: Installable as a progressive web app with offline capabilities
- **Particle Background**: Interactive particle.js background effect
- **Responsive**: Fully responsive design that works on all devices
- **Dynamic Content**: Content loaded from JSON files for easy updates
- **WhatsApp Integration**: Contact form directly sends messages via WhatsApp
- **SEO Optimized**: Complete meta tags for search engines and social media

## 📁 Project Structure

```
emon5/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline support
├── CNAME                   # Custom domain configuration
├── assets/
│   ├── favicon.png        # Site favicon
│   └── profile.jpeg       # Profile image
├── css/
│   ├── style.css          # Main stylesheet
│   └── dark-mode.css      # Dark mode styles
├── js/
│   ├── main.js            # Main JavaScript functionality
│   └── particles-config.js # Particle background configuration
└── data/
    ├── tools.json         # Tools data
    ├── projects.json      # Portfolio projects data
    └── skills.json        # Skills data
```

## 🚀 Getting Started

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/edwardtorangga911/emon5.git
cd emon5
```

2. Open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Visit `http://localhost:8000` in your browser

### Deployment to GitHub Pages

1. Push your changes to GitHub
2. Go to repository Settings → Pages
3. Select branch `main` and root folder
4. Save and wait for deployment

## 📝 Customization

### Update Profile Information

Edit `index.html` to update:

- Profile name and bio
- Social media links
- Contact information

### Add/Edit Tools

Edit `data/tools.json`:

```json
{
  "id": 1,
  "name": "Tool Name",
  "category": "Category",
  "icon": "fas fa-icon",
  "description": "Tool description",
  "url": "https://example.com",
  "type": "download"
}
```

### Add/Edit Projects

Edit `data/projects.json`:

```json
{
  "id": 1,
  "title": "Project Title",
  "description": "Project description",
  "image": "image-url",
  "technologies": ["Tech1", "Tech2"],
  "url": "project-url",
  "github": "github-url"
}
```

### Add/Edit Skills

Edit `data/skills.json`:

```json
{
  "category": "Category Name",
  "icon": "fas fa-icon",
  "skills": [{ "name": "Skill Name", "level": 85 }]
}
```

## 🎨 Color Customization

Edit CSS variables in `css/style.css`:

```css
:root {
  --primary-color: #0970e7;
  --text-primary: #000;
  --bg-primary: #ffffff;
  /* ... other variables */
}
```

## 🔧 Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- Particles.js
- Font Awesome 6.7.2
- Google Fonts (Inter, Nunito Sans)

## 📱 PWA Features

- Offline support via service worker
- Installable on mobile and desktop
- App-like experience
- Cached assets for faster loading

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Edward Torangga**

- Website: [emon.my.id](https://emon.my.id)
- GitHub: [@edwardtorangga911](https://github.com/edwardtorangga911)
- WhatsApp: [+62 895-1623-6789](https://wa.me/6289516236789)

## 🙏 Acknowledgments

- Particles.js for the interactive background
- Font Awesome for icons
- Google Fonts for typography

---

Made with ❤️ by Edward Torangga
