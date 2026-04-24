// ============================
// TIMER
// ============================
let timerInterval = null;
let timerRunning = false;
let timerStart = 0;
let timerElapsed = 0;
let useManualTime = false;

export function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

export function updateTimerDisplay() {
  const now = timerRunning ? Date.now() - timerStart + timerElapsed : timerElapsed;
  document.getElementById('timerDisplay').textContent = formatTime(now);
  document.getElementById('timerMs').textContent = '.' + (now % 1000).toString().padStart(3, '0');
}

export function timerToggle() {
  if (!timerRunning) {
    timerStart = Date.now();
    timerRunning = true;
    timerInterval = setInterval(updateTimerDisplay, 16);
    document.getElementById('timerStartBtn').textContent = '⏸ PAUSAR';
    document.getElementById('timerDisplay').classList.add('running');
    document.getElementById('timerStatus').textContent = 'EN MARCHA';
    document.getElementById('timerStatus').classList.add('active');
    if (navigator.vibrate) navigator.vibrate(30);
  } else {
    timerElapsed += Date.now() - timerStart;
    timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timerStartBtn').textContent = '▶ CONTINUAR';
    document.getElementById('timerDisplay').classList.remove('running');
    document.getElementById('timerStatus').textContent = 'PAUSADO';
    document.getElementById('timerStatus').classList.remove('active');
  }
}

export function timerReset() {
  timerRunning = false;
  clearInterval(timerInterval);
  timerElapsed = 0;
  timerStart = 0;
  updateTimerDisplay();
  document.getElementById('timerStartBtn').textContent = '▶ INICIAR';
  document.getElementById('timerDisplay').classList.remove('running');
  document.getElementById('timerStatus').textContent = 'LISTO';
  document.getElementById('timerStatus').classList.remove('active');
}

// ============================
// TIME SOURCE
// ============================
export function selectTimeSource(src) {
  useManualTime = src === 'manual';
  document.getElementById('srcTimer').classList.toggle('active', !useManualTime);
  document.getElementById('srcManual').classList.toggle('active', useManualTime);
  document.getElementById('manualTimeFields').style.display = useManualTime ? 'block' : 'none';
}

export function getCurrentTimeMs() {
  if (useManualTime) {
    const h = parseInt(document.getElementById('manualH').value, 10) || 0;
    const m = parseInt(document.getElementById('manualM').value, 10) || 0;
    const s = parseInt(document.getElementById('manualS').value, 10) || 0;

    if (h === 0 && m === 0 && s === 0) {
      throw new Error('⚠️ Introduce un tiempo válido');
    }

    return (h * 3600 + m * 60 + s) * 1000;
  }

  if (timerElapsed === 0 && !timerRunning) {
    throw new Error('⚠️ El cronómetro está en 0');
  }

  return timerRunning ? timerElapsed + (Date.now() - timerStart) : timerElapsed;
}
