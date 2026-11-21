/* ==========================================================================
   FRISBY S.A — checkout.html (dos pasos, pago simulado)
   Eventos: begin_checkout, add_shipping_info, add_payment_info
   Propiedad de usuario: tipo_cliente ("Nacional" | "Internacional")
   No se pide ni se guarda correo, teléfono, documento ni datos de tarjeta.
   ========================================================================== */
(function () {
  "use strict";

  /* Sin productos no hay checkout */
  if (!window.Carrito.lineas().length) {
    window.location.replace("carrito.html");
    return;
  }

  var items = window.Carrito.itemsGA();
  var valor = window.Carrito.valorDe(items); // productos con descuento, sin envío
  var cupon = window.Carrito.cuponActual();
  var tot = window.Carrito.totales();

  var selPais = document.getElementById("pais");
  var inputNombre = document.getElementById("nombre");
  var pasoEnvio = document.getElementById("paso-envio");
  var pasoPago = document.getElementById("paso-pago");
  var errEnvio = document.getElementById("error-envio");
  var errPago = document.getElementById("error-pago");
  var envioElegido = null;

  function cop(n) { return window.formatoCOP(n); }

  function paramsBase() {
    var p = { currency: "COP", value: valor, items: items };
    if (cupon) p.coupon = cupon;
    return p;
  }

  function servicioSeleccionado() {
    return document.querySelector('input[name="servicio"]:checked').value;
  }

  function metodoSeleccionado() {
    var el = document.querySelector('input[name="pago"]:checked');
    return el ? el.value : null;
  }

  /* ---------- Países ---------- */
  selPais.innerHTML = window.Carrito.PAISES.map(function (p) {
    return '<option value="' + p + '">' + p + (p === "Colombia" ? " (envío nacional)" : "") + "</option>";
  }).join("");

  /* ---------- Textos de tarifas y resumen ---------- */
  function actualizar() {
    var pais = selPais.value;
    [["Estándar", "txt-estandar"], ["Express", "txt-express"]].forEach(function (par) {
      var e = window.Carrito.calcularEnvio(pais, par[0], valor);
      var precio = e.gratis ? '<span class="gratis">GRATIS</span>' : cop(e.costo);
      var nota = (e.tipo === "Nacional" && par[0] === "Estándar" && !e.gratis)
        ? ' <small>(gratis desde ' + cop(window.Carrito.ENVIO_GRATIS_DESDE) + ' en productos)</small>' : "";
      document.getElementById(par[1]).innerHTML = "<strong>" + e.tier + "</strong> — " + precio + nota;
    });

    var envio = window.Carrito.calcularEnvio(pais, servicioSeleccionado(), valor);
    var filas = window.Carrito.lineas().map(function (l) {
      return '<div class="fila"><span>' + l.qty + " × " + l.producto.nombre + "</span><span>" + cop(l.subtotal) + "</span></div>";
    }).join("");

    document.getElementById("resumen").innerHTML =
      "<h2>Tu pedido</h2>" + filas +
      '<div class="fila"><span>Subtotal</span><span>' + cop(tot.bruto) + "</span></div>" +
      (cupon ? '<div class="fila descuento"><span>Descuento ' + cupon + "</span><span>-" + cop(tot.descuento) + "</span></div>" : "") +
      '<div class="fila"><span>Productos</span><span>' + cop(valor) + "</span></div>" +
      '<div class="fila"><span>Envío (' + envio.tier + ")</span><span>" +
      (envio.gratis ? '<span class="gratis">GRATIS</span>' : cop(envio.costo)) + "</span></div>" +
      '<div class="fila total"><span>Total a pagar</span><span>' + cop(valor + envio.costo) + "</span></div>" +
      '<p class="desc">Moneda: COP. Pago simulado: no se cobra nada.</p>';
  }

  selPais.addEventListener("change", actualizar);
  Array.prototype.forEach.call(document.querySelectorAll('input[name="servicio"]'), function (r) {
    r.addEventListener("change", actualizar);
  });
  actualizar();

  /* ---------- begin_checkout ---------- */
  window.Analitica.enviarEvento("begin_checkout", paramsBase());

  /* ---------- Paso 1 → Paso 2: add_shipping_info ---------- */
  function mostrarPaso(n) {
    pasoEnvio.hidden = n !== 1;
    pasoPago.hidden = n !== 2;
    document.getElementById("ind-1").classList.toggle("activo", n === 1);
    document.getElementById("ind-2").classList.toggle("activo", n === 2);
  }

  document.getElementById("btn-continuar").addEventListener("click", function () {
    var nombre = inputNombre.value.trim();
    var error = "";
    if (nombre.length < 2) {
      error = "Escribe un nombre ficticio (mínimo 2 letras).";
    } else if (/@/.test(nombre) || /\d{5,}/.test(nombre)) {
      error = "Eso parece un dato real (correo o número). Escribe un nombre inventado.";
    }
    if (error) {
      errEnvio.textContent = error;
      errEnvio.hidden = false;
      return;
    }
    errEnvio.hidden = true;

    envioElegido = window.Carrito.calcularEnvio(selPais.value, servicioSeleccionado(), valor);
    envioElegido.pais = selPais.value;
    envioElegido.nombre = nombre;

    window.Analitica.establecerPropiedadesUsuario({ tipo_cliente: envioElegido.tipo });

    var p = paramsBase();
    p.shipping_tier = envioElegido.tier; // "Nacional - Estándar", etc.
    window.Analitica.enviarEvento("add_shipping_info", p);

    mostrarPaso(2);
  });

  document.getElementById("btn-volver").addEventListener("click", function () {
    mostrarPaso(1);
  });

  /* ---------- Pagar (simulado): add_payment_info → gracias.html ---------- */
  function generarId() {
    var azar = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "FRISBY-" + Date.now().toString(36).toUpperCase() + "-" + azar;
  }

  document.getElementById("btn-pagar").addEventListener("click", function () {
    var metodo = metodoSeleccionado();
    if (!metodo) {
      errPago.textContent = "Elige un método de pago.";
      errPago.hidden = false;
      return;
    }
    errPago.hidden = true;
    this.disabled = true;

    var pedido = {
      transaction_id: generarId(),
      affiliation: window.AFILIACION,
      value: valor,
      shipping: envioElegido.costo,
      tipo_cliente: envioElegido.tipo,
      shipping_tier: envioElegido.tier,
      pais: envioElegido.pais,
      metodo_pago: metodo,
      nombre: envioElegido.nombre, // ficticio; solo vive en esta pestaña (sessionStorage)
      items: items,
      enviado: false
    };
    if (cupon) pedido.coupon = cupon;

    try { sessionStorage.setItem("frisby_pedido", JSON.stringify(pedido)); } catch (e) { /* nada */ }
    window.Carrito.vaciar();

    var p = paramsBase();
    p.payment_type = metodo;
    window.Analitica.enviarYNavegar("add_payment_info", p, "gracias.html");
  });
})();
