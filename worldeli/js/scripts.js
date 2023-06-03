// Obtener todos los enlaces de navegación
const navLinks = document.querySelectorAll('.nav-link');

// Agregar el evento click a cada enlace
navLinks.forEach(link => {
  link.addEventListener('click', function(event) {
    
    // Prevenir el comportamiento predeterminado del enlace
    // event.preventDefault();

    // Eliminar la clase 'active' de todos los enlaces
    navLinks.forEach(link => link.classList.remove('active'));

    // Agregar la clase 'active' al enlace clickado
    this.classList.add('active');
  });
});