/* ==========================================================================
   FRISBY S.A — carrito.html
   Eventos: view_cart, add_to_cart (botón +), remove_from_cart (botón − y Quitar)
   ========================================================================== */
(function () {
  "use strict";

  var cont = document.getElementById("carrito");
  var mensajeCupon = ""; // texto bajo el campo del cupón

  function cop(n) { return window.formatoCOP(n); }

  function render() {
    var lineas = window.Carrito.lineas();
    if (!lineas.length) {
      cont.innerHTML = '<div class="panel vacio">' +
        '<div class="vacio-icono" aria-hidden="true">🍗</div>' +
        '<h2>Tu carrito está vacío</h2>' +
        '<p>Agrega algo crujiente desde el catálogo.</p>' +
        '<a class="btn btn-rojo" href="index.html">Ver catálogo</a></div>';
      return;
    }

    var t = window.Carrito.totales();
    var hayCupon = t.cupon !== null;

    var htmlLineas = lineas.map(function (l) {
      var precio = '<span class="precio">' + cop(l.precioUnit) + '</span>' +
        (hayCupon ? '<span class="precio-tachado">' + cop(l.precioLista) + '</span>' : '');
      return '<div class="linea" data-id="' + l.producto.id + '">' +
        window.Carrito.arteHTML(l.producto, "mini") +
        '<div class="linea-info"><a href="producto.html?id=' + l.producto.id + '">' + l.producto.nombre + '</a>' +
        '<div class="categoria">' + l.producto.categoria + '</div><div>' + precio + '</div></div>' +
        '<div class="cantidad"><button type="button" data-accion="menos" aria-label="Disminuir">−</button>' +
        '<span>' + l.qty + '</span>' +
        '<button type="button" data-accion="mas" aria-label="Aumentar">+</button></div>' +
        '<div class="linea-subtotal">' + cop(l.subtotal) + '</div>' +
        '<button type="button" class="enlace-quitar" data-accion="quitar">Quitar del carrito</button>' +
        '</div>';
    }).join("");

    var cuponHTML = hayCupon
      ? '<p class="msg ok">✔ Cupón <strong>' + t.cupon + '</strong> aplicado (10 %). ' +
        '<button type="button" class="enlace-quitar" data-accion="quitar-cupon">Quitar cupón</button></p>'
      : '<div class="cupon-form"><input id="cupon-input" type="text" placeholder="Código de cupón" autocomplete="off">' +
        '<button type="button" class="btn btn-amarillo btn-pequeno" data-accion="aplicar-cupon">Aplicar</button></div>' +
        (mensajeCupon ? '<p class="msg error">' + mensajeCupon + '</p>' : '');

    cont.innerHTML =
      '<div class="carrito-grid">' +
        '<section class="panel">' + htmlLineas + '</section>' +
        '<aside class="panel resumen">' +
          '<h2>Resumen</h2>' +
          '<div class="fila"><span>Subtotal</span><span>' + cop(t.bruto) + '</span></div>' +
          (hayCupon ? '<div class="fila descuento"><span>Descuento ' + t.cupon + '</span><span>-' + cop(t.descuento) + '</span></div>' : '') +
          '<div class="fila total"><span>Total productos</span><span>' + cop(t.subtotal) + '</span></div>' +
          '<p class="desc">El envío se calcula en el checkout. Envío nacional estándar gratis desde ' + cop(window.Carrito.ENVIO_GRATIS_DESDE) + ' en productos.</p>' +
          cuponHTML +
          '<div class="botones"><a class="btn btn-rojo btn-grande" href="checkout.html" style="flex:1">Ir al checkout</a></div>' +
        '</aside>' +
      '</div>';
  }

  /* ---------- view_cart (al abrir el carrito con productos) ---------- */
  function enviarViewCart() {
    var items = window.Carrito.itemsGA();
    if (!items.length) return;
    var params = { currency: "COP", value: window.Carrito.valorDe(items), items: items };
    if (window.Carrito.cuponActual()) params.coupon = window.Carrito.cuponActual();
    window.Analitica.enviarEvento("view_cart", params);
  }

  /* ---------- add_to_cart / remove_from_cart ---------- */
  function eventoItem(nombreEvento, linea, unidades) {
    var items = [window.Carrito.itemGA(linea.producto, unidades, linea.index, window.Carrito.hayCupon())];
    window.Analitica.enviarEvento(nombreEvento, {
      currency: "COP",
      value: window.Carrito.valorDe(items),
      items: items
    });
  }

  function buscarLinea(id) {
    var ls = window.Carrito.lineas();
    for (var i = 0; i < ls.length; i++) if (ls[i].producto.id === id) return ls[i];
    return null;
  }

  cont.addEventListener("click", function (e) {
    var boton = e.target.closest("[data-accion]");
    if (!boton) return;
    var accion = boton.getAttribute("data-accion");
    var fila = boton.closest(".linea");
    var id = fila ? fila.getAttribute("data-id") : null;

    if (accion === "mas" && id) {
      var l1 = buscarLinea(id);
      window.Carrito.agregar(id, 1);
      eventoItem("add_to_cart", l1, 1);
    } else if (accion === "menos" && id) {
      var l2 = buscarLinea(id);
      window.Carrito.quitar(id, 1);
      eventoItem("remove_from_cart", l2, 1);
    } else if (accion === "quitar" && id) {
      var l3 = buscarLinea(id);
      var qty = window.Carrito.quitarLinea(id);
      eventoItem("remove_from_cart", l3, qty);
    } else if (accion === "aplicar-cupon") {
      var codigo = document.getElementById("cupon-input").value;
      if (window.Carrito.aplicarCupon(codigo)) {
        mensajeCupon = "";
      } else {
        mensajeCupon = "Cupón no válido. Prueba con BIENVENIDA10.";
      }
    } else if (accion === "quitar-cupon") {
      window.Carrito.quitarCupon();
      mensajeCupon = "";
    }
    render();
  });

  cont.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "cupon-input") {
      e.preventDefault();
      var b = cont.querySelector('[data-accion="aplicar-cupon"]');
      if (b) b.click();
    }
  });

  render();
  enviarViewCart();
})();
