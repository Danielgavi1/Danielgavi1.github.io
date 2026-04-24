import {
  CACHE_KEY,
  PLAYER_NAME_KEY,
  PLAYER_TOKEN_KEY,
  TABLE_NAME,
  hasSupabaseConfig,
  supabase
} from '../config/supabase.js';
import { formatTime, getCurrentTimeMs, timerReset } from './timer.js';
import { escHtml, setSyncInfo, showModal, showToast } from '../core/ui.js';

// ============================
// CLOUD RANKING
// ============================
let ranking = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
let realtimeChannel = null;

function getClaimedName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || '';
}

function setClaimedName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, String(name).trim().replace(/\s+/g, ' '));
}

function clearClaimedName() {
  localStorage.removeItem(PLAYER_NAME_KEY);
}

function getOwnerToken() {
  let token = localStorage.getItem(PLAYER_TOKEN_KEY);

  if (!token) {
    token = crypto.randomUUID
      ? crypto.randomUUID()
      : `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(PLAYER_TOKEN_KEY, token);
  }

  return token;
}

function clearOwnerToken() {
  localStorage.removeItem(PLAYER_TOKEN_KEY);
}

function getMyEntry() {
  return ranking.find((entry) => entry.is_mine) || null;
}

export function renderPlayerStatus() {
  const helpEl = document.getElementById('playerHelp');
  const inputEl = document.getElementById('playerName');
  const saveBtn = document.getElementById('saveRankingBtn');
  const deleteBtn = document.getElementById('deleteMyEntryBtn');

  const claimedName = getClaimedName();
  const myEntry = getMyEntry();

  if (myEntry) {
    if (inputEl && !inputEl.value.trim()) {
      inputEl.value = myEntry.name;
    }

    if (helpEl) {
      helpEl.innerHTML = `Este navegador está usando el alias <strong>${escHtml(myEntry.name)}</strong>. Si guardas otro tiempo con ese mismo nombre, se actualizará tu marca.`;
    }

    if (saveBtn) saveBtn.textContent = '♻️ ACTUALIZAR MI TIEMPO';
    if (deleteBtn) deleteBtn.disabled = false;
    return;
  }

  if (claimedName && inputEl && !inputEl.value.trim()) {
    inputEl.value = claimedName;
  }

  if (claimedName) {
    if (helpEl) {
      helpEl.innerHTML = `Este navegador recuerda el alias <strong>${escHtml(claimedName)}</strong>. Si ese alias ya lo usa otra persona, tendrás que elegir otro.`;
    }
  } else {
    if (helpEl) {
      helpEl.textContent = 'El alias que elijas quedará ligado a este navegador. No pueden existir dos usuarios con el mismo nombre.';
    }
  }

  if (saveBtn) saveBtn.textContent = '🏆 GUARDAR EN RANKING';
  if (deleteBtn) deleteBtn.disabled = true;
}

export async function saveToRanking() {
  const inputEl = document.getElementById('playerName');
  const rawName = String(inputEl.value || '').trim().replace(/\s+/g, ' ');

  if (!rawName) {
    showToast('⚠️ Pon tu nombre');
    return;
  }

  if (!hasSupabaseConfig) {
    showToast('⚠️ Falta configurar Supabase');
    setSyncInfo('Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY.');
    return;
  }

  let totalMs;
  try {
    totalMs = getCurrentTimeMs();
  } catch (error) {
    showToast(error.message);
    return;
  }

  const timeStr = `${formatTime(totalMs)}.${(totalMs % 1000).toString().padStart(3, '0')}`;
  const eventDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  setSyncInfo('Guardando o actualizando tu tiempo...');

  const { data, error } = await supabase.rpc('upsert_my_ranking_entry', {
    p_name: rawName,
    p_time_ms: totalMs,
    p_time_str: timeStr,
    p_event_date: eventDate,
    p_owner_token: getOwnerToken()
  });

  if (error) {
    console.error('Error upsert rpc:', error);

    if (String(error.message || '').includes('ALIAS_TAKEN')) {
      showToast('⚠️ Ese nombre ya existe en el ranking');
      setSyncInfo('Ese alias ya está ocupado. Elige otro diferente.');
      return;
    }

    showToast('❌ No se pudo guardar');
    setSyncInfo('Error al guardar o actualizar en Supabase.');
    return;
  }

  const savedName = data?.name || rawName;

  setClaimedName(savedName);
  inputEl.value = savedName;
  timerReset();
  showToast('🏆 Tiempo guardado correctamente');
  setSyncInfo('Sincronizando ranking...');
  if (navigator.vibrate) navigator.vibrate([30, 50, 100]);

  await loadRanking();
  renderPlayerStatus();
}

async function deleteMyEntry() {
  const myEntry = getMyEntry();

  if (!myEntry) {
    showToast('⚠️ No tienes ninguna marca asociada en este navegador');
    return;
  }

  setSyncInfo('Borrando tu marca...');

  const { data, error } = await supabase.rpc('delete_my_ranking_entry', {
    p_owner_token: getOwnerToken()
  });

  if (error) {
    console.error('Error delete rpc:', error);
    showToast('❌ No se pudo borrar');
    setSyncInfo('Error al borrar en Supabase.');
    return;
  }

  if (Number(data || 0) < 1) {
    showToast('⚠️ No se encontró tu marca para borrar');
    setSyncInfo('No se encontró ninguna fila vinculada a este navegador.');
    return;
  }

  clearClaimedName();
  clearOwnerToken();
  document.getElementById('playerName').value = '';
  showToast('🗑 Tu marca ha sido eliminada');
  setSyncInfo('Marca borrada correctamente.');

  await loadRanking();
  renderPlayerStatus();
}

export function confirmDeleteMyEntry() {
  const myEntry = getMyEntry();

  if (!myEntry) {
    showToast('⚠️ No tienes ninguna marca guardada en este navegador');
    return;
  }

  showModal(
    'Borrar mi marca',
    `¿Seguro que quieres borrar tu tiempo (${myEntry.name} — ${myEntry.time_str})?`,
    deleteMyEntry
  );
}

export async function loadRanking(showFeedback = false) {
  if (!hasSupabaseConfig) {
    setSyncInfo('Modo local: falta configurar Supabase.');
    renderRanking();
    renderPlayerStatus();
    return;
  }

  if (showFeedback) setSyncInfo('Actualizando ranking...');

  const { data, error } = await supabase.rpc('get_public_ranking', {
    p_owner_token: getOwnerToken()
  });

  if (error) {
    console.error('Error get_public_ranking:', error);
    setSyncInfo('No se pudo leer la nube. Revisa las funciones SQL de Supabase.');
    renderRanking();
    renderPlayerStatus();
    return;
  }

  ranking = Array.isArray(data) ? data : [];
  localStorage.setItem(CACHE_KEY, JSON.stringify(ranking));
  renderRanking();
  renderPlayerStatus();
  setSyncInfo(`Sincronizado correctamente. Última actualización: ${new Date().toLocaleTimeString('es-ES')}.`);
}

export function renderRanking() {
  const list = document.getElementById('rankingList');
  if (!list) return;

  document.getElementById('statTotal').textContent = ranking.length;
  document.getElementById('statBest').textContent = ranking.length
    ? (ranking[0].time_str || `${formatTime(Number(ranking[0].time_ms || 0))}.${String(Number(ranking[0].time_ms || 0) % 1000).padStart(3, '0')}`)
    : '—';

  if (!ranking.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🏆</span>
        <div class="empty-text">Sin registros aún.<br>¡Completa tu primera rutina!</div>
      </div>
    `;
    return;
  }

  const medalClass = ['gold', 'silver', 'bronze'];

  list.innerHTML = ranking.map((entry, i) => `
    <li class="ranking-item ${medalClass[i] || ''}">
      <div class="rank-pos">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
      <div class="rank-info">
        <div class="rank-name">
          ${escHtml(entry.name)}
          ${entry.is_mine ? '<span style="margin-left:8px;padding:3px 8px;border-radius:999px;background:rgba(124,58,237,0.18);border:1px solid rgba(167,139,250,0.35);font-size:0.7rem;font-weight:800;letter-spacing:0.03em;color:#ddd6fe;vertical-align:middle;">TÚ</span>' : ''}
        </div>
        <div class="rank-date">${entry.event_date || ''}</div>
      </div>
      <div class="rank-time">${entry.time_str}</div>
    </li>
  `).join('');
}

export function setupRealtime() {
  if (!hasSupabaseConfig) return;
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel('ranking-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      async () => {
        await loadRanking();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSyncInfo('Conectado en tiempo real. Los cambios se verán automáticamente.');
      }
    });
}

export function setupPlayerNameBlur() {
  const inputEl = document.getElementById('playerName');
  if (!inputEl) return;

  inputEl.addEventListener('blur', () => {
    inputEl.value = inputEl.value.trim().replace(/\s+/g, ' ');
    renderPlayerStatus();
  });
}
