document.oncontextmenu=function(){return!1},document.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelectorAll(".map-placeholder"),t=new IntersectionObserver(((e,t)=>{e.forEach((e=>{if(e.isIntersecting){const r=e.target.querySelector("iframe");r.src||(r.src=r.dataset.src),t.unobserve(e.target)}}))}),{threshold:0,rootMargin:"300px 0px"});e.forEach((e=>t.observe(e)))})),document.getElementById("year").textContent=(new Date).getFullYear(),document.addEventListener("DOMContentLoaded",(()=>{const e=document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right"),t=new IntersectionObserver((e=>{e.forEach((e=>{e.isIntersecting&&(e.target.classList.add("show"),t.unobserve(e.target))}))}),{threshold:.1,rootMargin:"0px 0px -50px 0px"});e.forEach((e=>t.observe(e)))}));

// Toggle Idiomas
(function () {
  const toggles = document.querySelectorAll('.lang-toggle');

  toggles.forEach(toggle => {
    const menu = document.getElementById(toggle.getAttribute('aria-controls'));

    function openMenu() {
      menu.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
    }

    function closeMenu() {
      menu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    }

    function toggleMenu(e) {
      e.stopPropagation();
      menu.classList.contains('show') ? closeMenu() : openMenu();
    }

    function onDocClick(e) {
      if (!menu.contains(e.target) && e.target !== toggle) closeMenu();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closeMenu();
    }

    toggle.addEventListener('click', toggleMenu);
  });
})();



// MODAL
function openModal(location) {
  document.getElementById("modalReservar").style.display = "flex";
  // Agregamos el campo hidden
  let hiddenInput = document.getElementById("ubicacion");
  if (!hiddenInput) {
    hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "ubicacion";
    hiddenInput.name = "ubicacion";
    document.querySelector("#modalReservar form").appendChild(hiddenInput);
  }
  hiddenInput.value = location;
}
function closeModal() {
  document.getElementById("modalReservar").style.display = "none";
}

// Cerrar al hacer clic fuera
window.onclick = function(event) {
  const modal = document.getElementById("modalReservar");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}


// VALIDACIÓN CORREO
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#modalReservar form");
    const emailInput = document.getElementById("email");

    form.addEventListener("submit", function(e) {
        const email = emailInput.value.trim();
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!regex.test(email)) {
            e.preventDefault(); // Evita envío
            alert("Por favor, introduce un correo electrónico válido.");
            emailInput.focus();
            return false;
        }
    });
});



// VALIDACIÓN FECHA
document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const ahora = new Date();

  // Formatear a YYYY-MM-DDTHH:MM (lo que espera datetime-local)
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");

  const fechaMin = `${año}-${mes}-${dia}T${horas}:${minutos}`;
  fechaInput.setAttribute("min", fechaMin);
});