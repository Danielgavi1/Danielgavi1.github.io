// Cerrar el menú desplegable
const navLinks = document.querySelectorAll('.nav-link');
const navbarCollapse = document.getElementById('navbarPapitu');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
            // Cierre más lento y fluido
            setTimeout(() => {
                new bootstrap.Collapse(navbarCollapse).hide();
            }, 400); // 400ms para una transición más rápida
        }
    });
});