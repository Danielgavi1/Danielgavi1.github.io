// Configuración inicial
const numbers = [
    '0', '32', '15', '19', '4', '21', '2', '25', '17', '34', '6', '27', '13',
    '36', '11', '30', '8', '23', '10', '5', '24', '16', '33', '1', '20', '14',
    '31', '9', '22', '18', '29', '7', '28', '12', '35', '3', '26'
];
const redNumbers = ['1', '3', '5', '7', '9', '12', '14', '16', '18', '19', '21', '23', '25', '27', '30', '32', '34', '36'];
const bets = {};
let balance = parseInt(localStorage.getItem('balance')) || 1000;
let spinning = false;
let history = JSON.parse(localStorage.getItem('history')) || [];

// Utilidades
const showToast = (message, duration = 3000) => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
};

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

// Crear mesa de apuestas
function createBettingTable() {
    const table = document.getElementById('betting-table');
    const zeroDiv = document.createElement('div');
    zeroDiv.className = 'number green';
    zeroDiv.textContent = '0';
    zeroDiv.style.gridColumn = '1 / span 2';
    zeroDiv.dataset.type = '0';
    zeroDiv.tabIndex = 0;
    zeroDiv.addEventListener('click', () => placeBet('0', 'number'));
    zeroDiv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') placeBet('0', 'number'); });
    table.appendChild(zeroDiv);

    for (let num = 1; num <= 36; num++) {
        const div = document.createElement('div');
        div.className = `number ${getNumberClass(num.toString())}`;
        div.textContent = num;
        div.dataset.type = num.toString();
        div.tabIndex = 0;
        div.addEventListener('click', () => placeBet(num.toString(), 'number'));
        div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') placeBet(num.toString(), 'number'); });
        table.appendChild(div);
    }

    const options = ['Rojo', 'Negro', 'Impar', 'Par', '1-18', '19-36', '1ª 12', '2ª 12', '3ª 12'];
    options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'bet-option';
        div.textContent = option;
        div.dataset.type = option;
        div.style.gridColumn = 'span 3';
        div.tabIndex = 0;
        div.addEventListener('click', () => placeBet(option, 'option'));
        div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') placeBet(option, 'option'); });
        table.appendChild(div);
    });
}

function getNumberClass(num) {
    if (num === '0') return 'green';
    return redNumbers.includes(num) ? 'red' : 'black';
}

// Colocar apuesta
function placeBet(type, category) {
    if (spinning) return;
    const betAmountInput = document.getElementById('bet-amount');
    const betAmount = parseInt(betAmountInput.value);
    const errorDiv = document.getElementById('bet-error');

    if (isNaN(betAmount) || betAmount <= 0) {
        errorDiv.textContent = 'Por favor, ingresa una cantidad válida.';
        errorDiv.classList.add('show');
        return;
    }
    if (betAmount > balance) {
        errorDiv.textContent = 'Saldo insuficiente.';
        errorDiv.classList.add('show');
        return;
    }

    errorDiv.classList.remove('show');
    bets[type] = (bets[type] || 0) + betAmount;
    balance -= betAmount;
    localStorage.setItem('balance', balance);

    const element = document.querySelector(`#betting-table div[data-type="${type}"]`);
    let chip = element.querySelector('.bet-chip');
    if (!chip) {
        chip = document.createElement('div');
        chip.className = 'bet-chip';
        chip.tabIndex = 0;
        chip.setAttribute('aria-label', `Eliminar apuesta de $${bets[type]} en ${type}`);
        element.appendChild(chip);
    }
    chip.textContent = `$${bets[type]}`;
    chip.setAttribute('aria-label', `Eliminar apuesta de $${bets[type]} en ${type}`);
    updateDisplay();
    showToast(`Apuesta de $${betAmount} colocada en ${type}`);
}

// Eliminar apuesta individual
function removeSingleBet(type) {
    if (spinning) {
        showToast('No puedes eliminar apuestas mientras la ruleta está girando');
        return;
    }
    if (bets[type]) {
        const amount = bets[type];
        balance += amount;
        localStorage.setItem('balance', balance);
        const element = document.querySelector(`#betting-table div[data-type="${type}"]`);
        const chip = element.querySelector('.bet-chip');
        if (chip) chip.remove();
        delete bets[type];
        updateDisplay();
        showToast(`Apuesta de $${amount} en ${type} eliminada`);
    }
}

// Borrar todas las apuestas
function clearBets() {
    if (spinning) {
        showToast('No puedes borrar apuestas mientras la ruleta está girando');
        return;
    }
    const totalCleared = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    Object.keys(bets).forEach(type => {
        const element = document.querySelector(`#betting-table div[data-type="${type}"]`);
        const chip = element.querySelector('.bet-chip');
        if (chip) chip.remove();
        balance += bets[type];
        delete bets[type];
    });
    localStorage.setItem('balance', balance);
    updateDisplay();
    if (totalCleared > 0) {
        showToast(`Se eliminaron apuestas por un total de $${totalCleared}`);
    }
}

// Resetear saldo
function resetBalance() {
    if (spinning) {
        showToast('No puedes resetear el saldo mientras la ruleta está girando');
        return;
    }
    balance = 1000;
    localStorage.setItem('balance', balance);
    clearBets();
    updateDisplay();
    showToast('Saldo reseteado a $1000');
}

// Actualizar interfaz
function updateDisplay() {
    document.getElementById('balance-amount').textContent = balance;
    const betsText = Object.entries(bets).map(([type, amount]) => `${type}: $${amount}`).join(', ');
    document.getElementById('bets-display').textContent = `Apuestas: ${betsText || 'Ninguna'}`;
}

// Actualizar historial
function updateHistory(winningNumber) {
    history.unshift(winningNumber);
    if (history.length > 10) history.pop();
    localStorage.setItem('history', JSON.stringify(history));
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    history.forEach(num => {
        const div = document.createElement('div');
        div.className = `history-item ${getNumberClass(num)}`;
        div.textContent = num;
        historyList.appendChild(div);
    });
}

// Girar ruleta
const spinWheel = debounce(() => {
    if (spinning || Object.keys(bets).length === 0) {
        showToast('¡Coloca al menos una apuesta para girar la ruleta!');
        return;
    }
    spinning = true;
    document.getElementById('spin-button').disabled = true;
    document.getElementById('clear-bets').disabled = true;
    document.getElementById('reset-balance').disabled = true;
    const wheel = document.getElementById('wheel');
    const ball = document.getElementById('ball');
    const resultDiv = document.getElementById('result');
    document.getElementById('wheel-container').classList.add('spinning');

    const randomDegree = Math.floor(Math.random() * 360) + 1080;
    wheel.style.transform = `rotate(${randomDegree}deg)`;

    setTimeout(() => {
        const winningNumber = numbers[Math.floor((randomDegree % 360) / (360 / numbers.length))];
        calculateWinnings(winningNumber);
        updateHistory(winningNumber);
        spinning = false;
        document.getElementById('spin-button').disabled = false;
        document.getElementById('clear-bets').disabled = false;
        document.getElementById('reset-balance').disabled = false;
        document.getElementById('wheel-container').classList.remove('spinning');
        wheel.style.transition = 'none';
        wheel.style.transform = 'rotate(0deg)';
        ball.style.transform = 'translateX(-50%)';
        setTimeout(() => {
            wheel.style.transition = 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)';
        }, 50);
        showToast(`Resultado: ${winningNumber}`);
    }, 6000);
}, 200);

// Calcular ganancias
function calculateWinnings(winningNumber) {
    let winnings = 0;
    const totalBetAmount = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    const resultDiv = document.getElementById('result');

    Object.entries(bets).forEach(([type, amount]) => {
        let won = false;
        if (type === winningNumber) {
            winnings += amount * 36;
            won = true;
        } else if (type === 'Rojo' && redNumbers.includes(winningNumber)) {
            winnings += amount * 2;
            won = true;
        } else if (type === 'Negro' && !redNumbers.includes(winningNumber) && winningNumber !== '0') {
            winnings += amount * 2;
            won = true;
        } else if (type === 'Impar' && parseInt(winningNumber) % 2 === 1) {
            winnings += amount * 2;
            won = true;
        } else if (type === 'Par' && parseInt(winningNumber) % 2 === 0 && winningNumber !== '0') {
            winnings += amount * 2;
            won = true;
        } else if (type === '1-18' && parseInt(winningNumber) <= 18 && winningNumber !== '0') {
            winnings += amount * 2;
            won = true;
        } else if (type === '19-36' && parseInt(winningNumber) >= 19) {
            winnings += amount * 2;
            won = true;
        } else if (type === '1ª 12' && parseInt(winningNumber) <= 12 && winningNumber !== '0') {
            winnings += amount * 3;
            won = true;
        } else if (type === '2ª 12' && parseInt(winningNumber) >= 13 && parseInt(winningNumber) <= 24) {
            winnings += amount * 3;
            won = true;
        } else if (type === '3ª 12' && parseInt(winningNumber) >= 25 && parseInt(winningNumber) <= 36) {
            winnings += amount * 3;
            won = true;
        }
        if (!won) {
            const element = document.querySelector(`#betting-table div[data-type="${type}"]`);
            const chip = element.querySelector('.bet-chip');
            if (chip) chip.remove();
        }
    });

    balance += winnings;
    localStorage.setItem('balance', balance);
    const amountDisplay = winnings > 0 ? winnings : totalBetAmount;
    resultDiv.textContent = `Resultado: ${winningNumber} - ${winnings > 0 ? '¡Ganaste' : 'Perdiste'} $${amountDisplay}`;
    Object.keys(bets).forEach(type => {
        const element = document.querySelector(`#betting-table div[data-type="${type}"]`);
        const chip = element.querySelector('.bet-chip');
        if (chip) chip.remove();
        delete bets[type];
    });
    updateDisplay();
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    createBettingTable();
    document.getElementById('spin-button').addEventListener('click', spinWheel);
    document.getElementById('spin-button').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') spinWheel();
    });
    document.getElementById('clear-bets').addEventListener('click', clearBets);
    document.getElementById('clear-bets').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') clearBets();
    });
    document.getElementById('reset-balance').addEventListener('click', resetBalance);
    document.getElementById('reset-balance').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') resetBalance();
    });
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const amount = parseInt(chip.dataset.amount);
            if (!isNaN(amount)) {
                document.getElementById('bet-amount').value = amount;
                document.getElementById('bet-error').classList.remove('show');
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
            }
        });
        chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const amount = parseInt(chip.dataset.amount);
                if (!isNaN(amount)) {
                    document.getElementById('bet-amount').value = amount;
                    document.getElementById('bet-error').classList.remove('show');
                    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                }
            }
        });
    });
    document.getElementById('bet-amount').addEventListener('input', () => {
        document.getElementById('bet-error').classList.remove('show');
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    });

    // Delegación de eventos para eliminar apuestas individuales
    const bettingTable = document.getElementById('betting-table');
    bettingTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('bet-chip')) {
            e.stopPropagation(); // Evitar que el clic en la ficha active el evento de la celda
            const type = e.target.closest('div[data-type]').dataset.type;
            removeSingleBet(type);
        }
    });
    bettingTable.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('bet-chip')) {
            e.stopPropagation(); // Evitar que el teclado en la ficha active el evento de la celda
            const type = e.target.closest('div[data-type]').dataset.type;
            removeSingleBet(type);
        }
    });

    updateDisplay();
    // Renderizar historial inicial sin duplicados
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    history.slice(0, 10).forEach(num => {
        const div = document.createElement('div');
        div.className = `history-item ${getNumberClass(num)}`;
        div.textContent = num;
        historyList.appendChild(div);
    });
});