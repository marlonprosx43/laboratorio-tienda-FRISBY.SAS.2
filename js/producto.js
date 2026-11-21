/* ==========================================================================
   FRISBY S.A — producto.html?id=... (detalle)
   Eventos: view_item, add_to_cart
   ========================================================================== */
(function () {
  "use strict";

  var cont = document.getElementById("detalle");
  var id = new URLSearchParams(window.location.search).get("id");
  var p = window.buscarProducto(id);

  if (!p) {
    cont.innerHTML = '<div class="panel vacio"><h2>Producto no encontrado</h2>' +
      '<p>El producto que buscas no existe en el catálogo.</p>' +
      '<a class="btn btn-rojo" href="index.html">Ir al catálogo</a></div>';
    return;
  }

  document.title = p.nombre + " | FRISBY S.A";

  cont.innerHTML =
    '<div class="detalle">' +
      window.Carrito.arteHTML(p, "grande") +
      '<div>' +
        '<span class="categoria">' + p.categoria + '</span>' +
        '<h1>' + p.nombre + '</h1>' +
        '<p class="precio">' + window.formatoCOP(p.precio) + ' <small>COP</small></p>' +
        '<p class="largo">' + p.descripcion + '</p>' +
        '<p class="desc">Código de producto: ' + p.id + '</p>' +
        '<div class="fila-accion">' +
          '<div class="selector">' +
            '<button type="button" id="menos" aria-label="Disminuir cantidad">−</button>' +
            '<input id="cantidad" type="text" inputmode="numeric" value="1" aria-label="Cantidad">' +
            '<button type="button" id="mas" aria-label="Aumentar cantidad">+</button>' +
          '</div>' +
          '<button type="button" id="agregar" class="btn btn-rojo btn-grande">Agregar al carrito</button>' +
        '</div>' +
        '<p id="confirmacion" class="msg ok" hidden>✔ Agregado al carrito. <a href="carrito.html">Ver carrito</a></p>' +
      '</div>' +
    '</div>';

  var inputQty = document.getElementById("cantidad");

  function leerCantidad() {
    var n = parseInt(inputQty.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 20) n = 20;
    inputQty.value = n;
    return n;
  }

  document.getElementById("menos").addEventListener("click", function () {
    inputQty.value = Math.max(1, leerCantidad() - 1);
  });
  document.getElementById("mas").addEventListener("click", function () {
    inputQty.value = Math.min(20, leerCantidad() + 1);
  });
  inputQty.addEventListener("change", leerCantidad);

  /* ---------- view_item ---------- */
  window.Analitica.enviarEvento("view_item", {
    currency: "COP",
    value: p.precio,
    items: [window.Carrito.itemGA(p, 1, 0, false)]
  });

  /* ---------- add_to_cart ---------- */
  document.getElementById("agregar").addEventListener("click", function () {
    var q = leerCantidad();
    window.Carrito.agregar(p.id, q);
    var items = [window.Carrito.itemGA(p, q, 0, window.Carrito.hayCupon())];
    window.Analitica.enviarEvento("add_to_cart", {
      currency: "COP",
      value: window.Carrito.valorDe(items),
      items: items
    });
    var conf = document.getElementById("confirmacion");
    conf.hidden = false;
    conf.classList.remove("msg-anim");
    void conf.offsetWidth;
    conf.classList.add("msg-anim");
    window.Carrito.toast("Agregado: " + q + " × " + p.nombre);
  });
})();
