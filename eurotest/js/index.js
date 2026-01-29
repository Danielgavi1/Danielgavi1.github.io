// State Management
let savings = localStorage.getItem('savings') ? parseInt(localStorage.getItem('savings')) : 0;
let totalTests = localStorage.getItem('totalTests') ? parseInt(localStorage.getItem('totalTests')) : 0;
let level = 1;

// UI Elements
const ui = {
    savings: document.getElementById('savings'),
    level: document.getElementById('userLevel'),
    modal: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalMsg: document.getElementById('modal-msg')
};

function init() {
    updateUI();
}

function addTest(btn) {
    // Capture old level before update
    const previousLevel = level;

    savings += 1;
    totalTests += 1;
    saveData();
    updateUI(); // This updates the global 'level' variable

    // Glamorous Confetti
    fireGlamConfetti();

    // Check Level Up
    // We compare the NEW global 'level' (updated by updateUI) with the OLD 'previousLevel'
    if (level > previousLevel) {
        const rankName = getRankName(level);
        setTimeout(() => {
            fireGlamConfetti();
            showModal('ESTADO DE ALAS ACTUALIZADO', `¡Felicidades! Ahora eres una ${rankName} (Nivel ${level}).`);
        }, 500);
    }

    // Check Prize Unlocks
    const prizeThresholds = [8, 15, 30, 40, 50];
    if (prizeThresholds.includes(savings)) {
        fireGlamConfetti();
        showModal('NUEVA RECOMPENSA DESBLOQUEADA', `Has alcanzado ${savings} créditos. Una nueva recompensa está disponible en el Closet.`);
    }
}

function removeTest() {
    if (savings > 0) {
        savings -= 1;
        if (totalTests > 0) totalTests -= 1;
        saveData();
        updateUI();
    }
}

function getRankName(lvl) {
    if (lvl === 1) return "Angel In Training";
    if (lvl === 2) return "Pink Angel";
    if (lvl === 3) return "Silver Angel";
    if (lvl === 4) return "Gold Angel";
    if (lvl >= 5) return "Supermodel Angel";
    return "Angel";
}

function updateUI() {
    if (ui.savings) ui.savings.textContent = savings;

    level = Math.floor(totalTests / 10) + 1;
    if (ui.level) ui.level.textContent = getRankName(level);

    // Update Next Tier
    const nextTierEl = document.querySelector('.status-next');
    if (nextTierEl) {
        if (level >= 5) {
            nextTierEl.textContent = "MAXIMUM STATUS ACHIEVED";
            nextTierEl.style.color = "#D4AF37";
        } else {
            nextTierEl.textContent = `NEXT TIER: ${getRankName(level + 1).toUpperCase()}`;
        }
    }
}

function saveData() {
    localStorage.setItem('savings', savings);
    localStorage.setItem('totalTests', totalTests);
}

function showModal(title, msg) {
    if (ui.modalTitle) ui.modalTitle.textContent = title;
    if (ui.modalMsg) ui.modalMsg.textContent = msg;
    if (ui.modal) ui.modal.style.display = 'flex';
}

function closeModal() {
    if (ui.modal) ui.modal.style.display = 'none';
}

function fireGlamConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#E91E63', '#000000', '#D4AF37'], // Hot Pink, Black, Gold
            scalar: 1
        });
    }
}

window.showModal = showModal;
window.closeModal = closeModal;

init();