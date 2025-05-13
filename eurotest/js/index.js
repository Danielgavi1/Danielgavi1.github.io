let savings = localStorage.getItem('savings') ? parseInt(localStorage.getItem('savings')) : 0;
const savingsElement = document.getElementById('savings');

// Inicializar el valor al cargar
updateSavings();

function addTest() {
    savings += 1;
    updateSavings();
    saveToLocalStorage();
    checkAchievements();
}

function removeTest() {
    if (savings > 0) {
        savings -= 1;
        updateSavings();
        saveToLocalStorage();
    }
}

function updateSavings() {
    savingsElement.textContent = savings+'€';
}

function saveToLocalStorage() {
    localStorage.setItem('savings', savings);
}

function checkAchievements() {
    let message = '';
    switch (savings) {
        // case 60:
        //     message = '¡Vale para una experiencia de cine con butacas VIP! 🎬';
        //     break;
        // case 70: 
        //     message = '¡Vale para un museo! 🖼️';
        //     break;
        // case 80: 
        //     message = '¡Concierto a la luz de las velas! 🎶🕯️';
        //     break;
        // case 90: 
        //     message = '¡Vale para un spa! 🧖‍♀️';
        //     break;
        // case 100: 
        //     message = '¡Cena en un restaurante de lujo! 🍾';
        //     break;

        case 8:
            message = '¡Vas por buen camino! 🎉 Has desbloqueado un nuevo premio!';
            break;
        case 15: 
            message = 'Premio de 15€ Entradas al cine (peli al gusto) 🍿';
            break;
        case 30: 
            message = 'Premio de 30€ ¡Cena temática en casa! 🍴';
            break;
        case 40: 
            message = 'Premio de 40€ ¡Entradas para Naturlandia! 🌳';
            break;
        case 50: 
            message = 'Premio de 50€ ¡Cena para dos desbloqueada! 🍽️🍣';
            break;
        case 60: 
            message = 'Premio de 60€ enseña las capturas a tu niño';
            break;
        case 70: 
            message = 'Premio de 70€ enseña las capturas a tu niño';
            break;
        case 80: 
            message = 'Premio de 80€ enseña las capturas a tu niño';
            break;
        case 90: 
            message = 'Premio de 90€ enseña las capturas a tu niño';
            break;
        case 100: 
            message = 'Premio de 100€ enseña las capturas a tu niño';
            break;
}
    if (message) {
        alert(message);
    }
}