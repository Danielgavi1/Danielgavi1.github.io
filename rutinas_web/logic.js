'use strict';

/* ============================================================
   LOGIC.JS — FUNCIONES PURAS BÁSICAS
   ============================================================
   Solo conserva utilidades necesarias para la sesión y edición
   de carga. No genera avisos automáticos de progreso.
   ============================================================ */

const Logic = (() => {

  /* ----------------------------------------------------------
     parseLoad: convierte el texto libre de carga en un número
     en kg para poder guardar el log de la sesión.
     Soporta:
       "20Kg"                      → 20
       "11.3Kg"                    → 11.3
       "barra (22.7Kg) + 15Kg"     → 37.7
       "—" / "" / texto sin número → null
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

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return {
    parseLoad,
    todayISO,
  };
})();
