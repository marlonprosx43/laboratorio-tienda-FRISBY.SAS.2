/* ==========================================================================
   FRISBY S.A — Lógica del carrito (localStorage), cupón y envío
   Expone window.Carrito. No envía eventos: eso lo hacen los archivos de página
   a través de window.Analitica.
   ========================================================================== */
(function () {
  "use strict";

  var CLAVE = "frisby_carrito";
  var CUPON = { codigo: "BIENVENIDA10", porcentaje: 10 };

  // Colombia = cliente Nacional; el resto = cliente Internacional.
  var PAISES = ["Colombia", "México", "Estados Unidos", "España", "Países Bajos", "Alemania", "Chile", "Perú"];

  // Tarifas de envío en COP
  var TARIFAS = {
    "Nacional": { "Estándar": 12000, "Express": 25000 },
    "Internacional": { "Estándar": 95000, "Express": 160000 }
  };
  var ENVIO_GRATIS_DESDE = 150000; // Solo Nacional Estándar, sobre el valor de productos ya con descuento

  /* ---------- Almacenamiento ---------- */
  function leer() {
    try {
      var d = JSON.parse(localStorage.getItem(CLAVE));
      if (d && Array.isArray(d.items)) {
        var limpios = d.items.filter(function (it) {
          return it && window.buscarProducto(it.id) && it.qty > 0;
        }).map(function (it) { return { id: it.id, qty: Math.floor(it.qty) }; });
        return { items: limpios, cupon: d.cupon === CUPON.codigo ? CUPON.codigo : null };
      }
    } catch (e) { /* datos corruptos: se ignoran */ }
    return { items: [], cupon: null };
  }

  function guardar(estado) {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ }
    actualizarInsignia();
  }

  function vaciar() {
    try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
    actualizarInsignia();
  }

  /* ---------- Cantidades ---------- */
  function cantidadTotal() {
    return leer().items.reduce(function (suma, it) { return suma + it.qty; }, 0);
  }

  function agregar(id, n) {
    n = n || 1;
    var e = leer();
    var existente = e.items.filter(function (it) { return it.id === id; })[0];
    if (existente) existente.qty += n; else e.items.push({ id: id, qty: n });
    guardar(e);
  }

  // Quita hasta n unidades. Devuelve cuántas se quitaron realmente.
  function quitar(id, n) {
    n = n || 1;
    var e = leer();
    var existente = e.items.filter(function (it) { return it.id === id; })[0];
    if (!existente) return 0;
    var quitadas = Math.min(n, existente.qty);
    existente.qty -= quitadas;
    e.items = e.items.filter(function (it) { return it.qty > 0; });
    guardar(e);
    return quitadas;
  }

  function quitarLinea(id) {
    var e = leer();
    var existente = e.items.filter(function (it) { return it.id === id; })[0];
    if (!existente) return 0;
    var qty = existente.qty;
    e.items = e.items.filter(function (it) { return it.id !== id; });
    guardar(e);
    return qty;
  }

  /* ---------- Cupón ---------- */
  function cuponActual() { return leer().cupon; }
  function hayCupon() { return leer().cupon !== null; }

  function aplicarCupon(codigo) {
    if (String(codigo || "").trim().toUpperCase() !== CUPON.codigo) return false;
    var e = leer();
    e.cupon = CUPON.codigo;
    guardar(e);
    return true;
  }

  function quitarCupon() {
    var e = leer();
    e.cupon = null;
    guardar(e);
  }

  function descuentoUnitario(precio) {
    return Math.round(precio * CUPON.porcentaje / 100);
  }

  /* ---------- Cálculos ---------- */
  function lineas() {
    var e = leer();
    return e.items.map(function (it, i) {
      var p = window.buscarProducto(it.id);
      var d = e.cupon ? descuentoUnitario(p.precio) : 0;
      return {
        index: i, producto: p, qty: it.qty,
        precioLista: p.precio, descUnit: d, precioUnit: p.precio - d,
        subtotal: (p.precio - d) * it.qty
      };
    });
  }

  function totales() {
    var ls = lineas();
    var bruto = 0, descuento = 0;
    ls.forEach(function (l) { bruto += l.precioLista * l.qty; descuento += l.descUnit * l.qty; });
    return { bruto: bruto, descuento: descuento, subtotal: bruto - descuento, cupon: cuponActual() };
  }

  // Ítem con el formato del contrato de medición. Con cupón: price = unitario con descuento.
  function itemGA(p, qty, index, conCupon) {
    var item = {
      item_id: p.id,
      item_name: p.nombre,
      item_brand: window.MARCA,
      item_category: p.categoria,
      price: p.precio,
      quantity: qty,
      index: index
    };
    if (conCupon) {
      var d = descuentoUnitario(p.precio);
      item.price = p.precio - d;
      item.discount = d;
      item.coupon = CUPON.codigo;
    }
    return item;
  }

  function itemsGA() {
    var conCupon = hayCupon();
    return lineas().map(function (l) { return itemGA(l.producto, l.qty, l.index, conCupon); });
  }

  // value = suma de price × quantity de los ítems
  function valorDe(items) {
    return items.reduce(function (suma, it) { return suma + it.price * it.quantity; }, 0);
  }

  function calcularEnvio(pais, servicio, subtotalProductos) {
    var tipo = pais === "Colombia" ? "Nacional" : "Internacional";
    var costo = TARIFAS[tipo][servicio];
    var gratis = false;
    if (tipo === "Nacional" && servicio === "Estándar" && subtotalProductos >= ENVIO_GRATIS_DESDE) {
      costo = 0;
      gratis = true;
    }
    return { tipo: tipo, servicio: servicio, tier: tipo + " - " + servicio, costo: costo, gratis: gratis };
  }

  /* ---------- Interfaz común ---------- */
  function actualizarInsignia() {
    var total = cantidadTotal();
    var els = document.querySelectorAll(".badge-carrito");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = total;
      els[i].classList.remove("badge-pop");
      void els[i].offsetWidth;
      if (total > 0) els[i].classList.add("badge-pop");
    }
  }

  function toast(mensaje) {
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = mensaje;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("toast-visible"); }, 10);
    setTimeout(function () { t.classList.remove("toast-visible"); }, 2200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2700);
  }

  // Bloque de color con siglas (sustituye a las imágenes)
  function arteHTML(p, claseExtra) {
    return '<div class="arte ' + (claseExtra || "") + '" style="background:' + p.color + ';color:' + p.colorTexto +
      '" aria-hidden="true">' + p.siglas + '</div>';
  }

  window.addEventListener("storage", actualizarInsignia);
  actualizarInsignia();

  window.Carrito = {
    CUPON: CUPON, PAISES: PAISES, TARIFAS: TARIFAS, ENVIO_GRATIS_DESDE: ENVIO_GRATIS_DESDE,
    leer: leer, vaciar: vaciar, cantidadTotal: cantidadTotal,
    agregar: agregar, quitar: quitar, quitarLinea: quitarLinea,
    cuponActual: cuponActual, hayCupon: hayCupon, aplicarCupon: aplicarCupon, quitarCupon: quitarCupon,
    lineas: lineas, totales: totales, itemGA: itemGA, itemsGA: itemsGA, valorDe: valorDe,
    calcularEnvio: calcularEnvio, actualizarInsignia: actualizarInsignia, toast: toast, arteHTML: arteHTML
  };
})();
