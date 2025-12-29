document.addEventListener('DOMContentLoaded', () => {
    updateDate();
});

function updateDate() {
    const dateDisplay = document.getElementById('date-display');
    if (!dateDisplay) return;

    const now = new Date();

    // Format: "29 dic"
    const options = { day: 'numeric', month: 'short' };
    let formattedDate = now.toLocaleDateString('es-ES', options);

    // Remove dot if present (some browsers add 29 dic.)
    formattedDate = formattedDate.replace('.', '');

    // Update the text textContent
    dateDisplay.textContent = `Semana de ${formattedDate} · 0% completado`;
}
