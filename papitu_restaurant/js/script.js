// SEGURIDAD
document.oncontextmenu = function(){return false;}


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
  }, { threshold: 0.1 });

  mapSections.forEach(section => observer.observe(section));
});