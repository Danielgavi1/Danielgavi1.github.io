'use strict';

/* ============================================================
   LOGIC.JS — FUNCIONES PURAS
   ============================================================
   Nada de DOM, nada de localStorage, nada de red.
   Toda función aquí recibe datos y devuelve datos.
   Esto es lo que se testea y lo que reutiliza tanto el render
   en vivo como el cálculo del gráfico de progresión.
   ============================================================ */

const Logic = (() => {

  /* ----------------------------------------------------------
     parseLoad: convierte el texto libre de carga en un número
     en kg para poder calcular PR/delta.
     Soporta:
       "20Kg"                      → 20
       "11.3Kg"                    → 11.3
       "barra (22.7Kg) + 15Kg"     → 37.7   (suma todos los números seguidos de Kg)
       "—" / "" / texto sin número → null   (no computable)
     ---------------------------------------------------------- */
  function parseLoad(loadText) {
    if (loadText == null) return null;
    const matches = String(loadText).match(/(\d+(?:[.,]\d+)?)\s*kg/gi);
    if (!matches || matches.length === 0) return null;

    const total = matches.reduce((sum, m) => {
      const num = parseFloat(m.replace(/kg/i, '').replace(',', '.').trim());
      return sum + (Number.isFinite(num) ? num : 0);
    }, 0);

    return total > 0 ? Math.round(total * 100) / 100 : null;
  }

  /* ----------------------------------------------------------
     calcVolume: sets × reps × kg
     Devuelve null si no hay carga numérica (ej. ejercicios con
     peso corporal sin Kg en el texto).
     ---------------------------------------------------------- */
  function calcVolume(loadKg, sets, reps) {
    const s = Number(sets) || 0;
    const r = Number(reps) || 0;
    if (loadKg == null || !s || !r) return null;
    return Math.round(loadKg * s * r * 100) / 100;
  }

  /* ----------------------------------------------------------
     calcDelta: diferencia entre la carga actual y el de
     la sesión anterior. Devuelve un objeto descriptivo listo
     para pintar en la tarjeta.
     ---------------------------------------------------------- */
  function calcDelta(current, previous) {
    if (current == null || previous == null) {
      return { kind: 'none', diff: null, pct: null };
    }
    const diff = Math.round((current - previous) * 100) / 100;
    const pct  = previous !== 0 ? Math.round((diff / previous) * 1000) / 10 : null;

    if (diff > 0)  return { kind: 'up',   diff, pct };
    if (diff < 0)  return { kind: 'down', diff, pct };
    return { kind: 'same', diff: 0, pct: 0 };
  }

  /* ----------------------------------------------------------
     sessionVolume: volumen total de una sesión completa
     (suma del volumen de todos los set_logs marcados como done).
     logs: array de { volumeKg, done }
     ---------------------------------------------------------- */
  function sessionVolume(logs) {
    return logs
      .filter(l => l.done && l.volumeKg != null)
      .reduce((sum, l) => sum + l.volumeKg, 0);
  }

  /* ----------------------------------------------------------
     formatDelta: texto corto y signo para la UI
     ---------------------------------------------------------- */
  function formatDelta(delta) {
    if (!delta || delta.kind === 'none') return null;
    if (delta.kind === 'same') return '=';
    const sign = delta.kind === 'up' ? '+' : '';
    return `${sign}${delta.diff}kg`;
  }

  /* ----------------------------------------------------------
     formatDate: dd/mm/yyyy corto para España
     ---------------------------------------------------------- */
  function formatDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /* ----------------------------------------------------------
     calcStreak: racha actual de sesiones marcadas como
     completadas (done !== false), recorriendo el historial
     de atrás hacia delante.
     history: array ordenado cronológicamente (antiguo→reciente)
     ---------------------------------------------------------- */
  function calcStreak(history) {
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].done === false) break;
      streak++;
    }
    return streak;
  }

  /* ----------------------------------------------------------
     bestStreak: la racha más larga histórica de sesiones
     completadas consecutivas (no solo la actual).
     ---------------------------------------------------------- */
  function bestStreak(history) {
    let best = 0, current = 0;
    for (const h of history) {
      if (h.done !== false) { current++; best = Math.max(best, current); }
      else current = 0;
    }
    return best;
  }

  /* ----------------------------------------------------------
     trendOf: pendiente simple (regresión lineal) sobre una
     serie de valores, para saber si la tendencia general es
     ascendente, descendente o plana — más robusto que comparar
     solo el primer y último punto si hay ruido sesión a sesión.
     values: array de números (puede contener huecos si se filtra antes)
     ---------------------------------------------------------- */
  function trendOf(values) {
    const pts = values.filter(v => v != null);
    if (pts.length < 2) return { slope: 0, kind: 'flat' };

    const n = pts.length;
    const xs = pts.map((_, i) => i);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = pts.reduce((a, b) => a + b, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (pts[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    const slope = den !== 0 ? num / den : 0;
    const relSlope = meanY !== 0 ? slope / meanY : 0;

    let kind = 'flat';
    if (relSlope > 0.01) kind = 'up';
    else if (relSlope < -0.01) kind = 'down';

    return { slope: Math.round(slope * 100) / 100, kind };
  }

  /* ----------------------------------------------------------
     estimateWeeksToTarget: a partir de la pendiente de volumen
     o carga, estima en cuántas sesiones futuras se alcanzaría
     un objetivo dado. Heurística simple (regresión lineal),
     se comunica como estimación, no como promesa.
     ---------------------------------------------------------- */
  function estimateSessionsToTarget(values, targetValue) {
    const pts = values.filter(v => v != null);
    if (pts.length < 2) return null;
    const last = pts[pts.length - 1];
    const { slope } = trendOf(pts);
    if (slope <= 0 || targetValue <= last) return null;
    const sessions = Math.ceil((targetValue - last) / slope);
    return sessions > 0 && sessions < 200 ? sessions : null;
  }

  return {
    parseLoad,
    calcVolume,
    calcDelta,
    sessionVolume,
    formatDelta,
    formatDate,
    todayISO,
    calcStreak,
    bestStreak,
    trendOf,
    estimateSessionsToTarget,
  };
})();
