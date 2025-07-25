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
    // const caloricGoalInput = document.getElementById('caloric-goal'); // This element doesn't exist in index.html, can be removed

    const imcOutput = document.getElementById('imc-output');
    const imcClassification = document.getElementById('imc-classification');
    const imcInfo = document.getElementById('imc-info');

    // Función para calcular el IMC
    function getIMCCategory(imc) {
        if (imc < 16) {
            return {
                category: "Bajo peso severo",
                color: "#2980b9",
                explanation: "Tu IMC es muy bajo. Esto puede representar un riesgo para tu salud. Consulta a un profesional."
            };
        } else if (imc >= 16 && imc < 17) {
            return {
                category: "Bajo peso moderado",
                color: "#3498db",
                explanation: "Tu peso está por debajo del rango saludable. Podrías necesitar apoyo nutricional."
            };
        } else if (imc >= 17 && imc < 18.5) {
            return {
                category: "Bajo peso leve",
                color: "#5dade2",
                explanation: "Tu peso está ligeramente por debajo del rango saludable. Mejora tu alimentación y actividad física."
            };
        } else if (imc >= 18.5 && imc < 25) {
            return {
                category: "Peso normal",
                color: "#2ecc71",
                explanation: "¡Felicidades! Tu peso está dentro del rango saludable."
            };
        } else if (imc >= 25 && imc < 27) {
            return {
                category: "Sobrepeso leve",
                color: "#f5b041",
                explanation: "Tu peso está ligeramente elevado. Ejercicio moderado y buena alimentación pueden ayudarte."
            };
        } else if (imc >= 27 && imc < 30) {
            return {
                category: "Sobrepeso moderado",
                color: "#f39c12",
                explanation: "Tienes sobrepeso. Es recomendable hacer cambios en tu estilo de vida para reducir riesgos."
            };
        } else if (imc >= 30 && imc < 35) {
            return {
                category: "Obesidad grado I",
                color: "#e67e22",
                explanation: "Obesidad leve. Consulta a un profesional para un plan de control de peso."
            };
        } else if (imc >= 35 && imc < 40) {
            return {
                category: "Obesidad grado II",
                color: "#d35400",
                explanation: "Obesidad moderada. Es importante buscar apoyo médico y nutricional."
            };
        } else {
            return {
                category: "Obesidad grado III (mórbida)",
                color: "#c0392b",
                explanation: "Obesidad severa. Requiere atención médica urgente para reducir riesgos graves."
            };
        }
    }

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
        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value);
        const edad = parseFloat(edadInput.value);
        const sexo = sexoInput.value;
        const actividadFactor = parseFloat(actividadInput.value);
        const formula = formulaInput.value;

        // Cálculo del IMC
        const alturaEnMetros = altura / 100;
        const imc = peso / (alturaEnMetros * alturaEnMetros);
    
        // Clasificación del IMC
        const imcData = getIMCCategory(imc);

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

        // Actualizar resultados
        tmbOutput.textContent = `${tmb.toFixed(2)} Kcal/día`;
        getOutput.textContent = `${get.toFixed(2)} Kcal/día`;
        
        // Mostrar IMC
        imcOutput.textContent = `${imc.toFixed(1)} kg/m²`;
        imcClassification.querySelector('.classification-text').textContent = imcData.category;
        imcClassification.style.backgroundColor = imcData.color + '20';
        imcClassification.style.borderColor = imcData.color;
        imcClassification.style.color = imcData.color;
        imcInfo.textContent = imcData.explanation;
        imcOutput.style.color = imcData.color;

        // Resultados con animación
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';
    }

    // Restablecer todos los campos y resultados
    function resetForm() {
        sexoInput.value = '';
        edadInput.value = '';
        pesoInput.value = '';
        alturaInput.value = '';
        actividadInput.value = '1.2'; // Valor por defecto
        formulaInput.value = 'harris'; // Valor por defecto
        // caloricGoalInput.value = ''; // Remove this line

        // Limpiar mensajes de error y estilos de invalidación
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

        // Limpiar y ocultar resultados
        clearResultsDisplay();
    }

    // New function to clear the results display
    function clearResultsDisplay() {
        tmbOutput.textContent = '-- Kcal/día';
        getOutput.textContent = '-- Kcal/día';
        imcOutput.textContent = '-- kg/m²';
        imcOutput.style.color = ''; // Reset color
        imcClassification.querySelector('.classification-text').textContent = '--';
        imcClassification.style.backgroundColor = ''; // Reset background
        imcClassification.style.borderColor = ''; // Reset border
        imcClassification.style.color = ''; // Reset text color
        imcInfo.textContent = 'El IMC es una medida de tu peso en relación a tu altura.';
        resultsSection.style.opacity = '0'; // Hide the section
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

    // Tema guardado o el preferido por el sistema
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

    function tryCalculate() {
        // Perform all validations
        const isSexoValid = validateSelect(sexoInput, sexoError, 'sexo');
        const isEdadValid = validateInput(edadInput, 10, 100, edadError, 'edad');
        const isPesoValid = validateInput(pesoInput, 30, 300, pesoError, 'peso');
        const isAlturaValid = validateInput(alturaInput, 100, 250, alturaError, 'altura');
        const isActividadValid = validateSelect(actividadInput, actividadError, 'nivel de actividad');

        // If ALL validations pass, perform calculation
        if (isSexoValid && isEdadValid && isPesoValid && isAlturaValid && isActividadValid) {
            calculateMetabolicRates();
        } else {
            // If ANY validation fails, clear the results display
            clearResultsDisplay();
        }
    }

    // Eventos
    edadInput.addEventListener('input', tryCalculate);
    pesoInput.addEventListener('input', tryCalculate);
    alturaInput.addEventListener('input', tryCalculate);
    sexoInput.addEventListener('change', tryCalculate);
    actividadInput.addEventListener('change', tryCalculate);
    formulaInput.addEventListener('change', tryCalculate);
    calculateBtn.addEventListener('click', tryCalculate); // Added calculate button event listener for explicit calculation
    resetBtn.addEventListener('click', resetForm);

    // Initial check when the page loads, in case there are pre-filled values
    // tryCalculate();
});