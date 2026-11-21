/* ==========================================================================
   FRISBY S.A — Medición con Google Analytics 4 + Monitor de eventos didáctico
   --------------------------------------------------------------------------
   - Carga gtag.js SOLO si GA_MEASUREMENT_ID tiene formato G-... y no es el
     marcador G-XXXXXXXXXX (ver js/config.js).
   - Expone window.Analitica con:
        enviarEvento(nombre, params)               -> envía un evento
        enviarYNavegar(nombre, params, url)        -> lo envía y luego navega
        establecerPropiedadesUsuario({...})        -> gtag('set','user_properties')
   - Dibuja el "Monitor de eventos" (panel derecho), que muestra cada evento
     aunque no haya ID de medición.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------ Configuración ------------------------------ */
  var CFG = window.TIENDA_CONFIG || {};
  var ID = String(CFG.GA_MEASUREMENT_ID || "").trim();
  var DEBUG = CFG.DEBUG_MODE === true;
  var ID_MARCADOR = "G-XXXXXXXXXX";
  var ID_VALIDO = /^G-[A-Z0-9]{4,}$/i.test(ID) && ID.toUpperCase() !== ID_MARCADOR;

  var CLAVE_EVENTOS = "frisby_eventos";
  var CLAVE_ORIGEN = "frisby_origen";
  var CLAVE_PROPS = "frisby_userprops";
  var CLAVE_OCULTO = "frisby_monitor_oculto";
  var MAX_EVENTOS = 12;

  /* ------------------------------ Carga de gtag ------------------------------ */
  window.dataLayer = window.dataLayer || [];
  if (ID_VALIDO) {
    window.gtag = function () { window.dataLayer.push(arguments); };
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID);
    document.head.appendChild(s);
    window.gtag("js", new Date());
    if (DEBUG) {
      window.gtag("config", ID, { debug_mode: true });
    } else {
      window.gtag("config", ID);
    }
  } else {
    window.gtag = function () { /* sin ID válido: no se envía nada */ };
  }

  /* ------------------------------ Utilidades ------------------------------ */
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cop(n) {
    return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function dos(n) { return (n < 10 ? "0" : "") + n; }

  function hora() {
    var d = new Date();
    return dos(d.getHours()) + ":" + dos(d.getMinutes()) + ":" + dos(d.getSeconds());
  }

  function leerJSON(almacen, clave, defecto) {
    try {
      var v = JSON.parse(almacen.getItem(clave));
      return v === null || v === undefined ? defecto : v;
    } catch (e) { return defecto; }
  }

  function escribir(almacen, clave, valor) {
    try { almacen.setItem(clave, typeof valor === "string" ? valor : JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
  }

  // Resumen legible de un evento para el monitor
  function resumir(nombre, p) {
    if (nombre === "page_view") return (p.page_title || "") + " · " + (p.page_path || "");
    var partes = [];
    if (p.item_list_id) partes.push("lista " + p.item_list_id);
    if (p.promotion_id) partes.push("promo " + p.promotion_id);
    if (p.items && p.items.length) {
      var nombres = p.items.slice(0, 3).map(function (i) {
        return i.item_name + (i.quantity > 1 ? " ×" + i.quantity : "");
      });
      var extra = p.items.length > 3 ? " +" + (p.items.length - 3) + " más" : "";
      partes.push(p.items.length + (p.items.length === 1 ? " ítem: " : " ítems: ") + nombres.join(", ") + extra);
    }
    if (typeof p.value === "number") partes.push("value " + cop(p.value));
    if (typeof p.shipping === "number") partes.push("envío " + cop(p.shipping));
    if (p.coupon) partes.push("cupón " + p.coupon);
    if (p.shipping_tier) partes.push(p.shipping_tier);
    if (p.payment_type) partes.push(p.payment_type);
    if (p.transaction_id) partes.push(p.transaction_id);
    if (p.tipo_cliente) partes.push("cliente " + p.tipo_cliente);
    return partes.join(" · ");
  }

  /* ------------------------------ Origen de la visita ------------------------------ */
  function capturarOrigen() {
    if (sessionStorage.getItem(CLAVE_ORIGEN)) return; // solo la primera página de la sesión
    var q = new URLSearchParams(window.location.search);
    var src = q.get("utm_source"), med = q.get("utm_medium"), cam = q.get("utm_campaign");
    var texto = (src || med || cam)
      ? (src || "(sin source)") + " / " + (med || "(sin medium)") + " · " + (cam || "(sin campaign)")
      : "directo (sin UTM)";
    escribir(sessionStorage, CLAVE_ORIGEN, texto);
  }

  /* ------------------------------ Registro en el monitor ------------------------------ */
  function registrar(nombre, params) {
    var copia;
    try { copia = JSON.parse(JSON.stringify(params || {})); } catch (e) { copia = {}; }
    var lista = leerJSON(sessionStorage, CLAVE_EVENTOS, []);
    lista.push({ h: hora(), n: nombre, r: resumir(nombre, copia), p: copia });
    if (lista.length > MAX_EVENTOS) lista = lista.slice(lista.length - MAX_EVENTOS);
    escribir(sessionStorage, CLAVE_EVENTOS, lista);
    pintarEventos();
  }

  function pintarEventos() {
    var ol = document.getElementById("monitor-eventos");
    if (!ol) return;
    var lista = leerJSON(sessionStorage, CLAVE_EVENTOS, []).slice().reverse();
    if (!lista.length) {
      ol.innerHTML = '<li class="ev-vacio">Aún no hay eventos.</li>';
      return;
    }
    ol.innerHTML = lista.map(function (e, idx) {
      var clase = e.n === "page_view" ? "ev-nombre ev-pv" : (e.n === "purchase" ? "ev-nombre ev-compra" : "ev-nombre");
      var esNuevo = idx === 0 ? " ev-nuevo" : "";
      return '<li class="ev' + esNuevo + '"><details><summary>' +
        '<span class="ev-hora">' + esc(e.h) + '</span> ' +
        '<span class="' + clase + '">' + esc(e.n) + '</span>' +
        '<span class="ev-res">' + esc(e.r) + '</span></summary>' +
        '<pre>' + esc(JSON.stringify(e.p, null, 1)) + '</pre></details></li>';
    }).join("");
  }

  function pintarPropiedades() {
    var el = document.getElementById("monitor-props");
    if (!el) return;
    var props = leerJSON(sessionStorage, CLAVE_PROPS, null);
    if (!props) { el.textContent = "(aún no establecida)"; return; }
    el.textContent = Object.keys(props).map(function (k) { return k + " = " + props[k]; }).join(", ");
  }

  /* ------------------------------ Envío de eventos ------------------------------ */
  function enviarEvento(nombre, params) {
    params = params || {};
    registrar(nombre, params);
    if (ID_VALIDO) {
      try { window.gtag("event", nombre, params); } catch (e) { /* no rompe la tienda */ }
    }
  }

  // Envía el evento y navega cuando GA confirma (event_callback), con
  // event_timeout de 1000 ms y un respaldo de 1200 ms por si gtag.js está bloqueado.
  function enviarYNavegar(nombre, params, url) {
    params = params || {};
    var yaNavego = false;
    function ir() {
      if (yaNavego) return;
      yaNavego = true;
      window.location.href = url;
    }
    registrar(nombre, params);
    if (!ID_VALIDO) { ir(); return; }
    var conCallback = {};
    Object.keys(params).forEach(function (k) { conCallback[k] = params[k]; });
    conCallback.event_callback = ir;
    conCallback.event_timeout = 1000;
    try { window.gtag("event", nombre, conCallback); } catch (e) { ir(); return; }
    setTimeout(ir, 1200);
  }

  function establecerPropiedadesUsuario(props) {
    escribir(sessionStorage, CLAVE_PROPS, props);
    pintarPropiedades();
    if (ID_VALIDO) {
      try { window.gtag("set", "user_properties", props); } catch (e) { /* nada */ }
    }
  }

  /* ------------------------------ Simular nuevo visitante ------------------------------ */
  function borrarCookiesGA() {
    var host = window.location.hostname;
    var dominios = [null, host];
    var esIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (!esIP && host.indexOf(".") !== -1) {
      var partes = host.split(".");
      for (var i = 0; i < partes.length - 1; i++) {
        var d = partes.slice(i).join(".");
        dominios.push(d, "." + d);
      }
    }
    var nombres = document.cookie.split(";").map(function (c) { return c.trim().split("=")[0]; })
      .filter(function (n) { return n.indexOf("_ga") === 0; });
    nombres.forEach(function (nombre) {
      dominios.forEach(function (dom) {
        document.cookie = nombre + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (dom ? "; domain=" + dom : "");
      });
    });
  }

  function simularNuevoVisitante() {
    borrarCookiesGA();
    try { localStorage.removeItem("frisby_carrito"); } catch (e) { /* nada */ }
    try { sessionStorage.clear(); } catch (e) { /* nada */ }
    window.location.href = "index.html";
  }

  /* ------------------------------ Panel del monitor ------------------------------ */
  function aplicarPlegado(oculto) {
    var panel = document.getElementById("monitor-ga4");
    var boton = document.getElementById("monitor-toggle");
    if (!panel) return;
    panel.classList.toggle("plegado", oculto);
    document.body.classList.toggle("monitor-oculto", oculto);
    boton.textContent = oculto ? "Mostrar" : "Ocultar";
    boton.setAttribute("aria-expanded", oculto ? "false" : "true");
  }

  function crearPanel() {
    var estado = ID_VALIDO
      ? '<div class="monitor-estado ok">Conectado a ' + esc(ID) + (DEBUG ? " · modo depuración" : "") + "</div>"
      : '<div class="monitor-estado error">Sin ID de medición: los eventos solo se muestran aquí. Edita js/config.js.</div>';

    var panel = document.createElement("aside");
    panel.id = "monitor-ga4";
    panel.className = "monitor";
    panel.setAttribute("aria-label", "Monitor de eventos de Google Analytics 4");
    var dot = '<span class="monitor-dot ' + (ID_VALIDO ? "online" : "offline") + '"></span>';
    panel.innerHTML =
      '<div class="monitor-cab"><strong>' + dot + 'Monitor GA4</strong>' +
      '<button type="button" id="monitor-toggle" aria-expanded="true">Ocultar</button></div>' +
      '<div class="monitor-cuerpo">' + estado +
      '<div class="monitor-bloque"><div class="monitor-etiqueta">Origen de la visita</div>' +
      '<div id="monitor-origen" class="monitor-valor"></div></div>' +
      '<div class="monitor-bloque"><div class="monitor-etiqueta">Propiedad de usuario</div>' +
      '<div id="monitor-props" class="monitor-valor"></div></div>' +
      '<button type="button" id="monitor-reset" class="monitor-reset">Simular nuevo visitante</button>' +
      '<div class="monitor-etiqueta">Últimos ' + MAX_EVENTOS + ' eventos (toca uno para ver sus parámetros)</div>' +
      '<ol id="monitor-eventos" class="monitor-lista"></ol></div>';
    document.body.appendChild(panel);

    document.getElementById("monitor-origen").textContent = sessionStorage.getItem(CLAVE_ORIGEN) || "directo (sin UTM)";
    pintarPropiedades();
    pintarEventos();

    document.getElementById("monitor-toggle").addEventListener("click", function () {
      var oculto = !panel.classList.contains("plegado");
      escribir(localStorage, CLAVE_OCULTO, oculto ? "1" : "0");
      aplicarPlegado(oculto);
    });
    document.getElementById("monitor-reset").addEventListener("click", simularNuevoVisitante);

    var guardado = null;
    try { guardado = localStorage.getItem(CLAVE_OCULTO); } catch (e) { /* nada */ }
    aplicarPlegado(guardado === "1");
  }

  function iniciar() {
    capturarOrigen();
    crearPanel();
    // page_view: GA4 lo envía solo con gtag('config'); aquí solo se muestra en el monitor.
    registrar("page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search
    });
  }

  if (document.body) iniciar();
  else document.addEventListener("DOMContentLoaded", iniciar);

  window.Analitica = {
    idValido: ID_VALIDO,
    idMedicion: ID,
    enviarEvento: enviarEvento,
    enviarYNavegar: enviarYNavegar,
    establecerPropiedadesUsuario: establecerPropiedadesUsuario
  };
})();
