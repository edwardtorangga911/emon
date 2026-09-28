/**
 * Interactive Aurora & Neural Constellation Canvas Animation
 * High-performance 60FPS background with dynamic gradient, floating glowing particles, and touch/mouse interaction.
 */

class InteractiveBackground {
  constructor() {
    this.canvas = document.getElementById("bg-canvas");
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "bg-canvas";
      document.body.prepend(this.canvas);
    }
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.orbs = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.time = 0;
    this.animId = null;

    this.init();
  }

  init() {
    this.resize();
    this.createOrbs();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.zIndex = "-1";
    this.canvas.style.pointerEvents = "none";
    this.ctx.scale(this.dpr, this.dpr);
  }

  createOrbs() {
    // 3 large soft glowing color orbs for aurora nebula effect
    this.orbs = [
      { x: this.width * 0.2, y: this.height * 0.25, r: 320, vx: 0.4, vy: 0.3, hue: 215 }, // Royal Blue
      { x: this.width * 0.8, y: this.height * 0.35, r: 350, vx: -0.3, vy: 0.4, hue: 185 }, // Cyan
      { x: this.width * 0.5, y: this.height * 0.8, r: 380, vx: 0.35, vy: -0.35, hue: 270 }  // Purple / Violet
    ];
  }

  createParticles() {
    this.particles = [];
    const count = Math.floor((this.width * this.height) / 14000);
    const particleCount = Math.min(Math.max(count, 35), 85);

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.2 + 1.2,
        baseSize: Math.random() * 2.2 + 1.2,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        alpha: Math.random() * 0.5 + 0.3,
        hue: Math.random() > 0.5 ? 210 : 180
      });
    }
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      this.resize();
      this.createParticles();
    });

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    window.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches[0]) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  drawAuroraOrbs(isDark) {
    // Render soft glowing gradient spheres in background
    for (const orb of this.orbs) {
      orb.x += orb.vx;
      orb.y += orb.vy;

      if (orb.x < -100 || orb.x > this.width + 100) orb.vx *= -1;
      if (orb.y < -100 || orb.y > this.height + 100) orb.vy *= -1;

      const gradient = this.ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, orb.r
      );

      if (isDark) {
        gradient.addColorStop(0, `hsla(${orb.hue}, 85%, 45%, 0.18)`);
        gradient.addColorStop(0.5, `hsla(${orb.hue}, 80%, 35%, 0.08)`);
        gradient.addColorStop(1, `hsla(${orb.hue}, 70%, 20%, 0)`);
      } else {
        gradient.addColorStop(0, `hsla(${orb.hue}, 90%, 65%, 0.22)`);
        gradient.addColorStop(0.5, `hsla(${orb.hue}, 85%, 75%, 0.10)`);
        gradient.addColorStop(1, `hsla(${orb.hue}, 80%, 85%, 0)`);
      }

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawParticles(isDark) {
    const maxDist = 135;
    const nodeColor = isDark ? "rgba(56, 189, 248, " : "rgba(37, 99, 235, ";
    const lineColor = isDark ? "56, 189, 248" : "37, 99, 235";

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Physics move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse interactivity (gently attract / hover glow)
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x -= (dx / dist) * force * 2.5;
          p.y -= (dy / dist) * force * 2.5;
          p.size = p.baseSize * (1 + force * 1.5);
        } else {
          p.size = p.baseSize;
        }
      }

      // Draw particle circle with gentle pulse
      p.alpha += Math.sin(this.time * p.pulseSpeed) * 0.006;
      const clampedAlpha = Math.max(0.15, Math.min(0.85, p.alpha));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${nodeColor}${clampedAlpha})`;
      this.ctx.shadowBlur = isDark ? 8 : 4;
      this.ctx.shadowColor = isDark ? "#38bdf8" : "#2563eb";
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Connect nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * (isDark ? 0.35 : 0.22);
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(${lineColor}, ${lineAlpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }

      // Connect to mouse if close
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const mdx = p.x - this.mouse.x;
        const mdy = p.y - this.mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < this.mouse.radius) {
          const mAlpha = (1 - mdist / this.mouse.radius) * 0.45;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = `rgba(${lineColor}, ${mAlpha})`;
          this.ctx.lineWidth = 1.2;
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.time++;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isDark = document.body.classList.contains("dark-mode");

    // 1. Draw glowing Aurora orbs
    this.drawAuroraOrbs(isDark);

    // 2. Draw connected neural starfield particles
    this.drawParticles(isDark);

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

// Auto start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.bgAnimation = new InteractiveBackground();
  });
} else {
  window.bgAnimation = new InteractiveBackground();
}
