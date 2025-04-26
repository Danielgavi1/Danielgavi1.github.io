document.addEventListener('DOMContentLoaded', () => {
    const savings = localStorage.getItem('savings') ? parseInt(localStorage.getItem('savings')) : 0;

    const achievements = [
        { id: 'prize8', threshold: 8, text: ' 8€ Café y pastel ☕🍰' },
        { id: 'prize15', threshold: 15, text: ' 15€ Entradas al cine (peli al gusto) 🍿' },
        { id: 'prize30', threshold: 30, text: ' 30€ Cena temática en casa 🍴' },
        // { id: 'prize40', threshold: 40, text: ' 40€ Entradas a Naturlandia 🌳' },
        // { id: 'prize50', threshold: 50, text: ' 50€ Cena para dos 🍽️' },
        // { id: 'prize60', threshold: 60, text: ' 60€ Experiencia de cine VIP (con camas) 🎬' },
        // { id: 'prize70', threshold: 70, text: ' Vale para un museo 🖼️' },
        // { id: 'prize80', threshold: 80, text: ' Concierto a la luz de las velas 🎶🕯️' },
        // { id: 'prize90', threshold: 90, text: ' 90€ Vale para un spa 🧖‍♀️' },
        // { id: 'prize100', threshold: 100, text: ' 100€ Cena en un restaurante de lujo 🍾' }
        { id: 'prize40', threshold: 40, text: ' Premio 40€ enseña las capturas a tu niño' },
        { id: 'prize50', threshold: 50, text: ' Premio 50€ enseña las capturas a tu niño' },
        { id: 'prize60', threshold: 60, text: ' Premio 60€ enseña las capturas a tu niño' },
        { id: 'prize70', threshold: 70, text: ' Premio sorpresa enseña las capturas a tu niño' },
        { id: 'prize80', threshold: 80, text: ' Premio sorpresa enseña las capturas a tu niño' },
        { id: 'prize90', threshold: 90, text: ' Premio 90€ enseña las capturas a tu niño' },
        { id: 'prize100', threshold: 100, text: ' Premio 100€ enseña las capturas a tu niño' }
    ];

    achievements.forEach(achievement => {
        const element = document.getElementById(achievement.id);
        if (savings >= achievement.threshold) {
            element.textContent = achievement.text; // Mostrar texto al desbloquear
            element.classList.remove('locked');
            element.classList.add('unlocked');
        } else {
            element.classList.remove('unlocked');
            element.classList.add('locked');
        }
    });
});