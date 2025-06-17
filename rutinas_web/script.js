function generarLista(titulo, ejercicios, persona) {
  let html = `<h2>${titulo}</h2><ul>`;
  ejercicios.forEach((ejercicio, i) => {
    const id = `${persona}-${titulo}-${i}`;
    
    // Aquí vamos a separar el nombre del ejercicio (en <strong>...</strong>)
    // y la parte editable (todo lo que sigue después)
    // Suponemos que el nombre está siempre dentro de <strong>...</strong>
    
    // Usamos regex para separar:
    const regex = /(<strong>.*?<\/strong>)(.*)/;
    const match = ejercicio.match(regex);
    let nombre = ejercicio, editableParte = "";
    if(match) {
      nombre = match[1]; // texto con etiquetas <strong>...</strong>
      editableParte = match[2].trim(); // lo que queda después
    }
    
    html += `
      <li>
        <input type="checkbox" id="${id}">
        <label for="${id}">${nombre} <span id="editable-${id}">${editableParte}</span></label>
        <button type="button" class="edit-btn" data-id="${id}">Editar texto</button>
      </li>`;
  });
  html += '</ul>';
  return html;
}

function renderRutina(persona, secciones) {
  let html = `<h1>${persona}</h1>`;
  for (const [titulo, ejercicios] of Object.entries(secciones)) {
    html += generarLista(titulo, ejercicios, persona);
  }

  html += `<button id="reset">🔄 Reiniciar</button>`;
  document.getElementById('contenido').innerHTML = html;

  // Restaurar estado de checkboxes desde localStorage
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    const saved = localStorage.getItem(checkbox.id);
    if (saved === "true") checkbox.checked = true;

    checkbox.addEventListener("change", () => {
      localStorage.setItem(checkbox.id, checkbox.checked);
    });
  });

  // Restaurar textos editados (solo la parte editable) desde localStorage
  document.querySelectorAll('.edit-btn').forEach(button => {
    const id = button.getAttribute('data-id');
    const editableSpan = document.getElementById(`editable-${id}`);
    const savedText = localStorage.getItem(`texto-${id}`);
    if (savedText) editableSpan.textContent = savedText;

    button.addEventListener('click', () => {
      if (button.textContent === "Editar texto") {
        // Habilitar edición solo en el span editable
        editableSpan.contentEditable = "true";
        editableSpan.focus();
        button.textContent = "Guardar";
      } else {
        // Guardar texto y deshabilitar edición
        editableSpan.contentEditable = "false";
        localStorage.setItem(`texto-${id}`, editableSpan.textContent.trim());
        button.textContent = "Editar texto";
      }
    });
  });

  // Botón reinicio
  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("¿Estás segur@ de que quieres reiniciar la rutina?")) {
      // Reset checkboxes
      document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
        localStorage.removeItem(checkbox.id);
      });
      // Reset textos editados
      document.querySelectorAll('.edit-btn').forEach(button => {
        const id = button.getAttribute('data-id');
        localStorage.removeItem(`texto-${id}`);
      });
      // Recargar rutina para resetear textos visibles
      cargarVictoria(); // o cargarDaniel() según quien quieras cargar
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
      "<strong>Extensión de cuádriceps:</strong> 27.5Kg 3 x 10 reps",
      "<strong>Curl de pierna:</strong> 12.5Kg 3 x 10 reps",
      "<strong>Abductor cadera:</strong> 67.5Kg 3 x 10 reps",
      "<strong>Aductor cadera:</strong> 60Kg 3 x 10 reps"
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
      "<strong>Extensión de cuádriceps:</strong> 45Kg 3 x 10 reps",
      "<strong>Curl de pierna:</strong> 25Kg 3 x 10 reps",
      "<strong>Abductor cadera:</strong> 95Kg 3 x 10 reps",
      "<strong>Aductor cadera:</strong> 95Kg 3 x 10 reps"
    ]
  };
  renderRutina("Daniel", rutina);
}

// Carga inicial por defecto
window.onload = cargarVictoria;
