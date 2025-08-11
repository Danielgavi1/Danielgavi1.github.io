// SEGURIDAD
document.oncontextmenu = function(){return false;}

// Activar el mapa solo cuando sea visible
document.addEventListener('DOMContentLoaded', () => {
  const mapSections = document.querySelectorAll('.map-placeholder');
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target.querySelector('iframe');
        if (!iframe.src) {
          iframe.src = iframe.dataset.src; // Carga la URL del mapa desde data-src
        }
        observer.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0, // Carga cuando el elemento está a punto de entrar en el viewport
    rootMargin: '300px 0px' // Carga el mapa 300px antes de que sea visible
  });

  mapSections.forEach(section => observer.observe(section));
});


// Actualizar el año en el footer automáticamente
document.getElementById("year").textContent = new Date().getFullYear();

// Animación elementos al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target); // solo una vez
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // ajustamos si queremos que aparezcan antes o después
    });

    elements.forEach(el => observer.observe(el));
  });