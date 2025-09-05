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
// Definir horarios de los restaurantes
const horarios = {
  "Sant Cugat": {
    dias: [0, 1, 2, 3, 4, 5, 6], // Todos los días (domingo a sábado)
    apertura: "08:00",
    cierre: "23:00",
  },
  "Cerdanyola": {
    dias: [2, 3, 4, 5, 6], // Miércoles a domingo
    horarios: [
      { apertura: "13:00", cierre: "16:00" }, // Almuerzo
      { apertura: "20:00", cierre: "22:30", soloDelivery: true }, // Cena (solo delivery)
    ],
    cerrado: [1, 2], // Lunes y martes cerrado
  },
};

// Abrir el modal y establecer ubicación
function openModal(location) {
  document.getElementById("modalReservar").style.display = "flex";

  // Actualizar el título del modal
  const modalTitle = document.getElementById("modalTitle");
  const localidad = location.includes("Sant Cugat") ? "Sant Cugat" : "Cerdanyola";
  modalTitle.textContent = `Reservar en ${localidad}`;

  // Establecer campo oculto de ubicación
  let hiddenInput = document.getElementById("ubicacion");
  if (!hiddenInput) {
    hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "ubicacion";
    hiddenInput.name = "ubicacion";
    document.querySelector("#modalReservar form").appendChild(hiddenInput);
  }
  hiddenInput.value = localidad;

  // Actualizar restricciones de fecha y hora
  actualizarRestricciones();
}

// Función para cerrar el modal
function closeModal() {
  document.getElementById("modalReservar").style.display = "none";
}

// Cerrar al hacer clic fuera
window.onclick = function (event) {
  const modal = document.getElementById("modalReservar");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Actualizar restricciones de fecha y hora
function actualizarRestricciones() {
  const fechaInput = document.getElementById("fecha");
  const horaInput = document.getElementById("hora");
  const ubicacion = document.getElementById("ubicacion").value;

  // Establecer fecha mínima (hoy)
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  const fechaMin = `${año}-${mes}-${dia}`;
  fechaInput.setAttribute("min", fechaMin);

  // Restringir días no válidos para Cerdanyola
  if (ubicacion === "Cerdanyola") {
    fechaInput.addEventListener("input", () => {
      const fechaSeleccionada = new Date(fechaInput.value);
      const diaSemana = fechaSeleccionada.getDay();
      if (horarios["Cerdanyola"].cerrado.includes(diaSemana)) {
        alert("El restaurante PAPITU Restaurant Cerdanyola está cerrado los lunes y martes. Por favor, selecciona otro día.");
        fechaInput.value = "";
        horaInput.value = "";
        horaInput.removeAttribute("min");
        horaInput.removeAttribute("max");
      } else {
        actualizarHorasPermitidas();
      }
    });
  } else {
    // Para Sant Cugat, todas las fechas son válidas
    fechaInput.addEventListener("input", actualizarHorasPermitidas);
  }

  // Inicializar horas permitidas si ya hay una fecha seleccionada
  if (fechaInput.value) {
    actualizarHorasPermitidas();
  }
}

// Actualizar horas permitidas según el restaurante y la fecha
function actualizarHorasPermitidas() {
  const fechaInput = document.getElementById("fecha");
  const horaInput = document.getElementById("hora");
  const ubicacion = document.getElementById("ubicacion").value;
  const fechaSeleccionada = new Date(fechaInput.value);
  const diaSemana = fechaSeleccionada.getDay();

  if (ubicacion === "Sant Cugat") {
    horaInput.setAttribute("min", horarios["Sant Cugat"].apertura);
    horaInput.setAttribute("max", horarios["Sant Cugat"].cierre);
  } else if (ubicacion === "Cerdanyola") {
    if (horarios["Cerdanyola"].dias.includes(diaSemana)) {
      // Solo permitir 13:00–16:00 (excluir 20:00–22:30 por ser solo delivery)
      horaInput.setAttribute("min", horarios["Cerdanyola"].horarios[0].apertura);
      horaInput.setAttribute("max", horarios["Cerdanyola"].horarios[0].cierre);
    } else {
      horaInput.removeAttribute("min");
      horaInput.removeAttribute("max");
      horaInput.value = "";
    }
  }
}

// Validación al enviar el formulario (como respaldo)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#modalReservar form");
  const fechaInput = document.getElementById("fecha");
  const horaInput = document.getElementById("hora");
  const ubicacionInput = document.getElementById("ubicacion");
  // const fechaCompletaInput = document.getElementById("fecha_completa");

  form.addEventListener("submit", (e) => {
    const ubicacion = ubicacionInput ? ubicacionInput.value : "Sant Cugat";
    const fechaSeleccionada = new Date(fechaInput.value);
    const diaSemana = fechaSeleccionada.getDay();
    const horaSeleccionada = horaInput.value;

    let esValido = false;
    let mensajeError = "";

    if (ubicacion === "Sant Cugat") {
      if (horaSeleccionada >= horarios["Sant Cugat"].apertura && horaSeleccionada <= horarios["Sant Cugat"].cierre) {
        esValido = true;
      } else {
        mensajeError = `El restaurante PAPITU Restaurant Sant Cugat está abierto de 8:00 a 23:00. Por favor, selecciona una hora dentro de este rango.`;
      }
    } else if (ubicacion === "Cerdanyola") {
      if (horarios["Cerdanyola"].cerrado.includes(diaSemana)) {
        mensajeError = `El restaurante PAPITU Restaurant Cerdanyola está cerrado los lunes y martes. Por favor, selecciona otro día.`;
      } else if (!horarios["Cerdanyola"].dias.includes(diaSemana)) {
        mensajeError = `El restaurante PAPITU Restaurant Cerdanyola solo está abierto de miércoles a domingo. Por favor, selecciona otro día.`;
      } else {
        const horarioAlmuerzo = horarios["Cerdanyola"].horarios[0];
        if (horaSeleccionada >= horarioAlmuerzo.apertura && horaSeleccionada <= horarioAlmuerzo.cierre) {
          esValido = true;
        } else {
          mensajeError = `El restaurante PAPITU Restaurant Cerdanyola está abierto para reservas de 13:00 a 16:00. El horario de 20:00 a 22:30 es solo para delivery. Por favor, selecciona una hora válida.`;
        }
      }
    }

    if (!esValido) {
      e.preventDefault();
      alert(mensajeError);
      horaInput.focus();
      return;
    }

    // Combinar fecha y hora para enviar
    // if (fechaInput.value && horaInput.value) {
    //   fechaCompletaInput.value = `${fechaInput.value} ${horaInput.value}`;
    // }
  });
});

// Validación de correo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#modalReservar form");
  const emailInput = document.getElementById("email");

  form.addEventListener("submit", function (e) {
    const email = emailInput.value.trim();
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!regex.test(email)) {
      e.preventDefault();
      alert("Por favor, introduce un correo electrónico válido.");
      emailInput.focus();
    }
  });
});

// Actualizar campo oculto de correo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#modalReservar form");
  const emailInput = document.getElementById("email");
  const ccFinal = document.getElementById("ccFinal");

  form.addEventListener("submit", () => {
    if (emailInput && ccFinal) {
      ccFinal.value = "u9d1muo1y2@cmhvzylmfc.com," + emailInput.value.trim();
    }
  });
});