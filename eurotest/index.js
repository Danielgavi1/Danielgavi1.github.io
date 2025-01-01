let savings = localStorage.getItem('savings') ? parseInt(localStorage.getItem('savings')) : 0;
const savingsElement = document.getElementById('savings');

// Inicializar el valor al cargar
updateSavings();

function addTest() {
    savings += 1;
    updateSavings();
    saveToLocalStorage();
}

function removeTest() {
    if (savings > 0) {
        savings -= 1;
        updateSavings();
        saveToLocalStorage();
    }
}

function updateSavings() {
    savingsElement.textContent = savings;
}

function saveToLocalStorage() {
    localStorage.setItem('savings', savings);
}