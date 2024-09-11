// Algoritmo de Luhn
function luhnAlgorithm(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
}

// Detección de la red de la tarjeta
function getCardNetwork(cardNumber) {
    // Normalizar el número de tarjeta eliminando espacios y guiones
    cardNumber = cardNumber.replace(/\D/g, '');

    if (/^4/.test(cardNumber)) {
        return "Visa";
    } else if (/^5[1-5]/.test(cardNumber)) {
        return "MasterCard";
    } else if (/^3[47]/.test(cardNumber)) {
        return "American Express";
    } else if (/^6(?:011|5)/.test(cardNumber)) {
        return "Discover";
    } else if (/^3(?:0[0-5]|[68])/.test(cardNumber)) {
        return "Diners Club";
    } else if (/^356|^357/.test(cardNumber)) { // Ajustado para JCB
        return "JCB";
    } else {
        return "Desconocida";
    }
}




// Validar Tarjeta
function validateCard() {
    const cardNumber = document.getElementById('cardNumber').value.trim().replace(/\s/g, '');
    const result = document.getElementById('result');
    const inputField = document.getElementById('cardNumber');

    // Verifica si la entrada contiene solo números y tiene entre 13 y 19 dígitos
    if (!/^\d{13,19}$/.test(cardNumber)) {
        result.innerHTML = 'Por favor, introduce un número de tarjeta válido (entre 13 y 19 dígitos).';
        result.className = 'result invalid';
        inputField.classList.add('invalid');
        inputField.classList.remove('valid');
        return;
    }

    // Detecta la red de la tarjeta
    const network = getCardNetwork(cardNumber);

    // Validar tarjeta con algoritmo de Luhn
    const isValid = luhnAlgorithm(cardNumber);
    if (isValid) {
        result.innerHTML = `El número de tarjeta es válido.<br><strong>Red: ${network}</strong>`;
        result.className = 'result valid';
        inputField.classList.add('valid');
        inputField.classList.remove('invalid');
    } else {
        result.innerHTML = `El número de tarjeta es inválido.<br><strong>Red: ${network}</strong>`;
        result.className = 'result invalid';
        inputField.classList.add('invalid');
        inputField.classList.remove('valid');
    }
}


// Formatear el número de tarjeta automáticamente en bloques de 4 dígitos
function formatCardNumber(event) {
    const input = event.target;
    const value = input.value.replace(/\D/g, '').substring(0, 19);
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 '); // Bloques de 4 dígitos
    input.value = formattedValue;
}

// Limitar entrada a solo números y formatear
function validateInput(event) {
    const input = event.target;
    input.value = input.value.replace(/\D/g, ''); // Solo permitir números
    formatCardNumber(event); // Formatear en bloques de 4
}

// DARK MODE
document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    this.textContent = isDarkMode ? '🌕 Cambiar a Modo Claro' : '🌙 Cambiar a Modo Oscuro';
});