function generarLista(titulo, ejercicios, persona) {
  let html = `<h2>${titulo}</h2><ul>`;
  ejercicios.forEach((ejercicio, i) => {
    const id = `${persona}-${titulo}-${i}`;
    html += `
      <li>
        <input type="checkbox" id="${id}">
        <label for="${id}">${ejercicio}</label>
      </li>`;
  });
  html += '</ul>';
  return html;
}

function renderRutina(persona, secciones) {
  let html = `<h1>${persona}</h1>`; // Solo aparece una vez aquí
  for (const [titulo, ejercicios] of Object.entries(secciones)) {
    html += generarLista(titulo, ejercicios, persona);
  }

  html += `<button id="reset">🔄 Reiniciar</button>`;
  document.getElementById('contenido').innerHTML = html;

  // Restaurar estado de checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    const saved = localStorage.getItem(checkbox.id);
    if (saved === "true") checkbox.checked = true;

    checkbox.addEventListener("change", () => {
      localStorage.setItem(checkbox.id, checkbox.checked);
    });
  });

  // Botón reinicio
  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("¿Estás segur@ de que quieres reiniciar la rutina?")) {
      document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
        localStorage.removeItem(checkbox.id);
      });
    }
  });
}


function cargarVictoria() {
  const rutina = {
    "🍑 Culo 🍑": [
      "<strong>Hip trust:</strong> barra (20Kg?) + 10Kg 4 x 10 reps + negativa al fallo",
      "<strong>Press pierna sentada</strong> (ajustar rango completo 🍑): 45Kg 3 x 10 reps",
      "<strong>Patada de glúteo:</strong> 4 x 10 reps",
      "<strong>Peso muerto rumano:</strong> 3 x 10 reps",
      "<strong>Sentadilla búlgara con mancuerna:</strong> 4 x 10 reps",
      "<strong>Abductor focalizado glúteo 🍑:</strong> 3 x 10 reps",
      "<strong>Hacka:</strong> (barra) 3 x 10 reps",
      "<strong>Sentadilla goblet:</strong> 3 x 10 reps",
      "<strong>Sentadilla sumo con mancuerna:</strong> 3 x 10 reps"
    ],
    "🦵 Pierna 🦵": [
      "<strong>Press pierna sentada</strong> (ajustar a rango medio 🦵): 55Kg 4 x 10 reps",
      "<strong>Femoral tumbada:</strong> 10Kg 3 x 10 reps",
      "<strong>Extensión de cuádriceps:</strong> 27Kg 3 x 10 reps",
      "<strong>Curl de pierna:</strong> 12.5Kg 3 x 10 reps",
      "<strong>Abductor cadera:</strong> 62.5Kg 3 x 10 reps",
      "<strong>Aductor cadera:</strong> 45Kg 3 x 10 reps"
    ]
  };
  renderRutina("Victoria", rutina);
}

function cargarDaniel() {
  const rutina = {
    "🍑 Culo 🍑": [
      "<strong>Hip trust:</strong> barra (20Kg?) + 15Kg 4 x 10 reps",
      "<strong>Press pierna sentado</strong> (ajustar rango completo 🍑): 75Kg 3 x 10 reps",
      "<strong>Patada de glúteo:</strong> 4 x 10 reps",
      "<strong>Peso muerto rumano:</strong> 3 x 10 reps",
      "<strong>Sentadilla búlgara con mancuerna:</strong> 4 x 10 reps",
      "<strong>Abductor focalizado glúteo 🍑:</strong> 3 x 10 reps",
      "<strong>Hacka:</strong> (barra) 3 x 10 reps",
      "<strong>Sentadilla goblet:</strong> 3 x 10 reps",
      "<strong>Sentadilla sumo con mancuerna:</strong> 3 x 10 reps"
    ],
    "🦵 Pierna 🦵": [
      "<strong>Press pierna sentado</strong> (ajustar a rango medio 🦵): 95Kg 4 x 10 reps",
      "<strong>Femoral tumbado:</strong> 25Kg 3 x 10 reps",
      "<strong>Extensión de cuádriceps:</strong> 35Kg 3 x 10 reps",
      "<strong>Curl de pierna:</strong> 25Kg 3 x 10 reps",
      "<strong>Abductor cadera:</strong> 92.5Kg 3 x 10 reps",
      "<strong>Aductor cadera:</strong> 95Kg 3 x 10 reps"
    ]
  };
  renderRutina("Daniel", rutina);
}



// Carga inicial por defecto
window.onload = cargarVictoria;
