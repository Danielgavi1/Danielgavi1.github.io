function generarLista(titulo, ejercicios, persona) {
  let html = `<h2>${titulo}</h2><ul>`;
  ejercicios.forEach((ejercicio, i) => {
    const id = `${persona}-${titulo}-${i}`.replace(/[^a-zA-Z0-9-]/g, '-');
    const regex = /(<strong>.*?<\/strong>)(.*)/;
    const match = ejercicio.match(regex);
    let nombre = ejercicio, editableParte = "";
    if (match) {
      nombre = match[1];
      editableParte = match[2].trim();
    }

    html += `
      <li data-exercise="${nombre.replace(/<strong>|<\/strong>/g, '').toLowerCase()}">
        <input type="checkbox" id="${id}">
        <label for="${id}">${nombre} <span id="editable-${id}">${editableParte}</span></label>
        <button type="button" class="edit-btn" data-id="${id}">Editar texto</button>
      </li>`;
  });
  html += '</ul>';
  return html;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function configurarBuscador(persona) {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  let resultados = [];
  let indiceActual = -1;

  const updateSearch = debounce(() => {
    const query = searchInput.value.trim().toLowerCase();
    const ejercicios = document.querySelectorAll('li[data-exercise]');
    resultados = [];
    indiceActual = -1;

    ejercicios.forEach(ejercicio => {
      ejercicio.classList.remove('highlight');
      ejercicio.classList.remove('hidden');
    });

    if (query) {
      resultados = fuzzysort.go(query, Array.from(ejercicios), {
        key: 'dataset.exercise',
        threshold: -1000
      }).map(result => result.obj);

      if (resultados.length > 0) {
        resultados.forEach(ejercicio => ejercicio.classList.add('highlight'));
        ejercicios.forEach(ejercicio => {
          if (!resultados.includes(ejercicio)) ejercicio.classList.add('hidden');
        });
        indiceActual = 0;
        resultados[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchResults.textContent = `${resultados.length} ejercicio${resultados.length > 1 ? 's' : ''} encontrado${resultados.length > 1 ? 's' : ''}`;
        searchResults.classList.remove('no-results');
      } else {
        searchInput.classList.add('no-results');
        setTimeout(() => searchInput.classList.remove('no-results'), 500);
        searchResults.textContent = 'No se encontraron ejercicios';
        searchResults.classList.add('no-results');
      }
    } else {
      searchResults.textContent = '';
    }

    localStorage.setItem(`searchQuery-${persona}`, searchInput.value);
  }, 300);

  searchInput.addEventListener('input', updateSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && resultados.length > 0) {
      e.preventDefault();
      if (indiceActual < resultados.length - 1) {
        indiceActual++;
        resultados[indiceActual].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

function renderRutina(persona, secciones) {
  let html = `<h1>${persona}</h1>`;
  for (const [titulo, ejercicios] of Object.entries(secciones)) {
    html += generarLista(titulo, ejercicios, persona);
  }

  html += `<button id="reset">🔄 Reiniciar</button>`;
  document.getElementById('contenido').innerHTML = html;

  // Restaurar checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    const saved = localStorage.getItem(checkbox.id);
    if (saved === "true") checkbox.checked = true;

    checkbox.addEventListener("change", () => {
      localStorage.setItem(checkbox.id, checkbox.checked);
    });
  });

  // Restaurar textos editables
  document.querySelectorAll('.edit-btn').forEach(button => {
    const id = button.getAttribute('data-id');
    const editableSpan = document.getElementById(`editable-${id}`);
    const savedText = localStorage.getItem(`texto-${id}`);
    if (savedText) editableSpan.textContent = savedText;

    button.addEventListener('click', () => {
      if (button.textContent === "Editar texto") {
        editableSpan.contentEditable = "true";
        editableSpan.focus();
        button.textContent = "Guardar";
      } else {
        editableSpan.contentEditable = "false";
        localStorage.setItem(`texto-${id}`, editableSpan.textContent.trim());
        button.textContent = "Editar texto";
      }
    });
  });

  // Botón reiniciar
  const resetBtn = document.getElementById("reset");
  resetBtn.addEventListener("click", () => {
    if (confirm("¿Estás segur@ de que quieres reiniciar la rutina?")) {
      document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
        localStorage.removeItem(checkbox.id);
      });

      document.querySelectorAll('.edit-btn').forEach(button => {
        const id = button.getAttribute('data-id');
        localStorage.removeItem(`texto-${id}`);
      });

      localStorage.removeItem(`searchQuery-${persona}`);
      document.getElementById('searchInput').value = '';
      document.getElementById('searchResults').textContent = '';

      if (persona === "Victoria") {
        cargarVictoria();
      } else {
        cargarDaniel();
      }
    }
  });

  // Configurar buscador
  configurarBuscador(persona);

  // Restaurar búsqueda guardada
  const savedSearch = localStorage.getItem(`searchQuery-${persona}`);
  if (savedSearch) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = savedSearch;
    searchInput.dispatchEvent(new Event('input'));
  }
}

function cargarVictoria() {
  const rutina = {
    "<img src='./img/culo.webp' width='25%'>": [
      "<strong>Hip trust:</strong> 10Kg 4 x 10 reps + negativa al fallo",
      "<strong>Patada de glúteo:</strong> 20Kg 4 x 10 reps",
      "<strong>Press pierna sentada</strong> (ajustar rango completo 🍑): 45Kg 3 x 10 reps",
      "<strong>Peso muerto rumano:</strong> 3 x 10 reps",
      "<strong>Sentadilla búlgara con mancuerna:</strong> 4 x 10 reps",
      "<strong>Abductor focalizado glúteo 🍑:</strong> 50Kg 4 x 10 reps",
      "<strong>Hacka:</strong> (barra) 3 x 10 reps"
    ],
    "<img src='./img/pierna.webp' width='25%'>": [
      "<strong>Femoral tumbada:</strong> 10Kg 3 x 10 reps",
      "<strong>Extensión de cuádriceps:</strong> 27.5Kg 3 x 10 reps",
      "<strong>Curl de pierna:</strong> 12.5Kg 3 x 10 reps",
      "<strong>Abductor cadera:</strong> 82.5Kg 3 x 10 reps",
      "<strong>Aductor cadera:</strong> 75Kg 3 x 10 reps"
    ],
    "<img src='./img/espalda.webp' width='30%'>": [
      "<strong>Estirar hacia abajo:</strong> 27.5Kg 3 x 10 reps",
      "<strong>Remo:</strong> 15Kg 3 x 10 reps"
    ]
  };
  renderRutina("Victoria", rutina);
}

function cargarDaniel() {
  const rutina = {
    "<img src='./img/culo.webp' width='25%'>": [
      "<strong>Hip trust:</strong> 20Kg 4 x 10 reps",
      "<strong>Patada de glúteo:</strong> 20Kg 4 x 10 reps",
      "<strong>Press pierna sentado</strong> (ajustar rango completo 🍑): 75Kg 3 x 10 reps",
      "<strong>Peso muerto rumano:</strong> 3 x 10 reps",
      "<strong>Sentadilla búlgara con mancuerna:</strong> 4 x 10 reps",
      "<strong>Abductor focalizado glúteo 🍑:</strong> 50Kg 3 x 10 reps",
      "<strong>Hacka:</strong> (barra) 3 x 10 reps"
    ],
    "<img src='./img/pierna.webp' width='25%'>": [
      "<strong>Femoral tumbado:</strong> 25Kg 3 x 10 reps",
      "<strong>Extensión de cuádriceps:</strong> 45Kg 3 x 10 reps",
      "<strong>Curl de pierna:</strong> 25Kg 3 x 10 reps",
      "<strong>Abductor cadera:</strong> 152.5Kg 3 x 10 reps",
      "<strong>Aductor cadera:</strong> 125Kg 3 x 10 reps"
    ],
    "<img src='./img/espalda.webp' width='30%'>": [
      "<strong>Estirar hacia abajo:</strong> 75Kg 3 x 10 reps",
      "<strong>Remo:</strong> 75Kg 3 x 10 reps"
    ]
  };
  renderRutina("Daniel", rutina);
}

// === MODO OSCURO ===
function aplicarModoOscuro() {
  const dark = localStorage.getItem('modoOscuro');
  if (dark === 'true') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

// Actualizar icono del botón de modo oscuro
function actualizarIconoModoOscuro() {
  const darkToggle = document.getElementById("darkModeToggle");
  if (!darkToggle) return;

  const isDark = document.body.classList.contains("dark");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
}

// === INICIO DE LA APP ===
window.addEventListener("DOMContentLoaded", () => {
  // Aplicar modo oscuro guardado
  aplicarModoOscuro();
  actualizarIconoModoOscuro();

  // Configurar botón de modo oscuro
  const darkToggle = document.getElementById("darkModeToggle");
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
      actualizarIconoModoOscuro();
    });
  }

  // Configurar botones de cambio de rutina
  document.getElementById("victoriaBtn").addEventListener("click", cargarVictoria);
  document.getElementById("danielBtn").addEventListener("click", cargarDaniel);

  // Cargar rutina por defecto
  cargarVictoria();
});