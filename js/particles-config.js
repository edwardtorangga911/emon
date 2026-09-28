// Particles.js Configuration adaptive for both light & dark themes
function initParticles() {
  if (typeof particlesJS === "undefined") return;

  const isDark = document.body.classList.contains("dark-mode");
  const particleColor = isDark ? "#38bdf8" : "#2563eb";
  const lineColor = isDark ? "#3b82f6" : "#60a5fa";

  particlesJS("particles-js", {
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          value_area: 900
        }
      },
      color: {
        value: particleColor
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: isDark ? 0.35 : 0.22,
        random: true
      },
      size: {
        value: 3,
        random: true
      },
      line_linked: {
        enable: true,
        distance: 140,
        color: lineColor,
        opacity: isDark ? 0.25 : 0.15,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false
      }
    },
    interactivity: {
      detect_on: "window",
      events: {
        onhover: {
          enable: true,
          mode: "grab"
        },
        onclick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 130,
          line_linked: {
            opacity: 0.5
          }
        },
        push: {
          particles_nb: 3
        }
      }
    },
    retina_detect: true
  });
}
