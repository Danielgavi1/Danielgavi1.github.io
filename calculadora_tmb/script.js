document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const sexoInput = document.getElementById('sexo');
    const edadInput = document.getElementById('edad');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
    const actividadInput = document.getElementById('actividad');
    const formulaInput = document.getElementById('formula');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const resultsSection = document.getElementById('results-section');

    const sexoError = document.getElementById('sexo-error');
    const edadError = document.getElementById('edad-error');
    const pesoError = document.getElementById('peso-error');
    const alturaError = document.getElementById('altura-error');
    const actividadError = document.getElementById('actividad-error');

    const tmbOutput = document.getElementById('tmb-output');
    const getOutput = document.getElementById('get-output');
    const caloricGoalInput = document.getElementById('caloric-goal');

    // Función para validar campos de entrada
    function validateInput(inputElement, min, max, errorMessageElement, fieldName) {
        const value = parseFloat(inputElement.value);
        if (inputElement.value.trim() === '') {
            errorMessageElement.textContent = `Por favor, introduce tu ${fieldName}.`;
            inputElement.classList.add('invalid-input');
            return false;
        } else if (isNaN(value)) {
            errorMessageElement.textContent = `Introduce un valor numérico válido para ${fieldName}.`;
            inputElement.classList.add('invalid-input');
            return false;
        } else if (value < min || value > max) {
            errorMessageElement.textContent = `${fieldName} debe estar entre ${min} y ${max}.`;
            inputElement.classList.add('invalid-input');
            return false;
        } else {
            errorMessageElement.textContent = ''; // Limpiar mensaje de error
            inputElement.classList.remove('invalid-input');
            return true;
        }
    }

    // Validación específica para selects
    function validateSelect(selectElement, errorMessageElement, fieldName) {
        if (selectElement.value === '' || selectElement.value === null) {
            errorMessageElement.textContent = `Por favor, selecciona tu ${fieldName}.`;
            selectElement.classList.add('invalid-input');
            return false;
        } else {
            errorMessageElement.textContent = '';
            selectElement.classList.remove('invalid-input');
            return true;
        }
    }

    // Función principal para calcular TMB y GET
    function calculateMetabolicRates() {
        // Realizar todas las validaciones
        const isSexoValid = validateSelect(sexoInput, sexoError, 'sexo');
        const isEdadValid = validateInput(edadInput, 10, 100, edadError, 'edad');
        const isPesoValid = validateInput(pesoInput, 30, 300, pesoError, 'peso');
        const isAlturaValid = validateInput(alturaInput, 100, 250, alturaError, 'altura');
        const isActividadValid = validateSelect(actividadInput, actividadError, 'nivel de actividad');

        // Si alguna validación falla, detener el cálculo
        if (!isSexoValid || !isEdadValid || !isPesoValid || !isAlturaValid || !isActividadValid) {
            tmbOutput.textContent = '-- Kcal/día'; // Reiniciar si los datos son inválidos
            getOutput.textContent = '-- Kcal/día'; // Reiniciar si los datos son inválidos
            resultsSection.style.opacity = '0'; // Ocultar resultados si hay errores
            return;
        }

        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value);
        const edad = parseFloat(edadInput.value);
        const sexo = sexoInput.value;
        const actividadFactor = parseFloat(actividadInput.value);
        const formula = formulaInput.value;

        let tmb = 0;

        // Cálculo de TMB según la fórmula seleccionada
        if (formula === 'harris') {
            // Harris-Benedict (revisada)
            if (sexo === 'masculino') {
                tmb = 66.5 + (13.75 * peso) + (5.003 * altura) - (6.775 * edad);
            } else { // femenino
                tmb = 655.1 + (9.563 * peso) + (1.850 * altura) - (4.676 * edad);
            }
        } else { // Mifflin-St Jeor
            if (sexo === 'masculino') {
                tmb = (10 * peso) + (6.25 * altura) - (5 * edad) + 5;
            } else { // femenino
                tmb = (10 * peso) + (6.25 * altura) - (5 * edad) - 161;
            }
        }

        const get = tmb * actividadFactor;

        tmbOutput.textContent = `${tmb.toFixed(2)} Kcal/día`;
        getOutput.textContent = `${get.toFixed(2)} Kcal/día`;

        // Mostrar sección de resultados con una animación
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';
    }

    // Función para restablecer todos los campos
    function resetForm() {
        sexoInput.value = '';
        edadInput.value = '';
        pesoInput.value = '';
        alturaInput.value = '';
        actividadInput.value = '1.2'; // Valor por defecto
        formulaInput.value = 'harris'; // Valor por defecto
        caloricGoalInput.value = '';

        // Limpiar mensajes de error y estilos
        sexoError.textContent = '';
        edadError.textContent = '';
        pesoError.textContent = '';
        alturaError.textContent = '';
        actividadError.textContent = '';

        sexoInput.classList.remove('invalid-input');
        edadInput.classList.remove('invalid-input');
        pesoInput.classList.remove('invalid-input');
        alturaInput.classList.remove('invalid-input');
        actividadInput.classList.remove('invalid-input');

        tmbOutput.textContent = '-- Kcal/día';
        getOutput.textContent = '-- Kcal/día';

        resultsSection.style.opacity = '0'; // Ocultar la sección de resultados
    }

    // Funcionalidad del tema oscuro/claro
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            themeToggle.checked = false;
        }
    }

    // Cargar el tema guardado o el preferido por el sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        }
    });

    // Event Listeners
    calculateBtn.addEventListener('click', calculateMetabolicRates);
    resetBtn.addEventListener('click', resetForm);

    // Añadir validación en tiempo real y re-cálculo para los campos relevantes
    edadInput.addEventListener('input', () => { validateInput(edadInput, 10, 100, edadError, 'edad'); calculateMetabolicRates(); });
    pesoInput.addEventListener('input', () => { validateInput(pesoInput, 30, 300, pesoError, 'peso'); calculateMetabolicRates(); });
    alturaInput.addEventListener('input', () => { validateInput(alturaInput, 100, 250, alturaError, 'altura'); calculateMetabolicRates(); });
    sexoInput.addEventListener('change', () => { validateSelect(sexoInput, sexoError, 'sexo'); calculateMetabolicRates(); });
    actividadInput.addEventListener('change', () => { validateSelect(actividadInput, actividadError, 'nivel de actividad'); calculateMetabolicRates(); });
    formulaInput.addEventListener('change', calculateMetabolicRates); // ¡Esta es la clave para la fórmula!
});


// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registrado:', reg))
      .catch(err => console.error('Error al registrar SW:', err));
  });
}

// Detectar instalación PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  const installBtn = document.createElement('button');
  installBtn.textContent = 'Instalar app';
  installBtn.classList.add('primary-btn');
  installBtn.style.position = 'fixed';
  installBtn.style.bottom = '20px';
  installBtn.style.left = '50%';
  installBtn.style.transform = 'translateX(-50%)';
  installBtn.style.zIndex = '9999';
  document.body.appendChild(installBtn);

  installBtn.addEventListener('click', () => {
    e.prompt();
    e.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        console.log('Usuario aceptó instalar');
      }
      installBtn.remove();
    });
  });
});