/* ==========================================================================
   FRISBY S.A — CONFIGURACIÓN (este es el ÚNICO archivo que debes editar)
   ==========================================================================

   1) GA_MEASUREMENT_ID
      Pega aquí tu ID de medición de Google Analytics 4. Lo encuentras en:
      GA4 → Administrar (engranaje) → Flujos de datos → tu flujo web →
      "ID de medición". Tiene la forma  G-ABC123DEF4  (empieza por "G-").

      - Mientras dejes el marcador  "G-XXXXXXXXXX"  NO se carga Google
        Analytics: los eventos solo se muestran en el monitor de la derecha.
      - Mantén las comillas. Ejemplo:  GA_MEASUREMENT_ID: "G-ABC123DEF4"

   2) DEBUG_MODE
      true  → cada evento se envía con debug_mode y lo verás en tiempo real
              en GA4 → Administrar → DebugView. Úsalo durante el laboratorio.
      false → los eventos se envían normalmente, sin debug_mode.
   ========================================================================== */
window.TIENDA_CONFIG = {
  GA_MEASUREMENT_ID: "G-33KL83DSL9", // <-- PEGA AQUÍ TU ID DE MEDICIÓN (G-...)
  DEBUG_MODE: true                   // <-- true = modo depuración (DebugView)
};
