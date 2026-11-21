/* ==========================================================================
   FRISBY S.A — index.html (catálogo)
   Eventos: view_item_list, view_promotion, select_promotion, select_item, add_to_cart
   ========================================================================== */
(function () {
  "use strict";

  var LISTA_ID = "catalogo_principal";
  var LISTA_NOMBRE = "Catálogo principal";
  var PROMO = {
    promotion_id: "BIENVENIDA10",
    promotion_name: "Cupón de bienvenida 10%",
    creative_name: "banner_bienvenida",
    creative_slot: "inicio_superior"
  };

  var cont = document.getElementById("catalogo");

  /* ---------- Pintar catálogo ---------- */
  cont.innerHTML = window.PRODUCTOS.map(function (p, i) {
    return '<article class="tarjeta">' +
      '<a class="tarjeta-enlace" href="producto.html?id=' + p.id + '" data-id="' + p.id + '" data-index="' + i + '">' +
      window.Carrito.arteHTML(p) +
      '<div class="tarjeta-info"><span class="categoria">' + p.categoria + '</span>' +
      '<h3>' + p.nombre + '</h3><p class="desc">' + p.descripcion + '</p></div></a>' +
      '<div class="tarjeta-pie"><span class="precio">' + window.formatoCOP(p.precio) + '</span>' +
      '<button type="button" class="btn btn-rojo btn-pequeno" data-agregar="' + p.id + '">Agregar</button></div>' +
      '</article>';
  }).join("");

  /* ---------- view_item_list ---------- */
  function itemsConLista() {
    return window.PRODUCTOS.map(function (p, i) {
      var it = window.Carrito.itemGA(p, 1, i, false);
      it.item_list_id = LISTA_ID;
      it.item_list_name = LISTA_NOMBRE;
      return it;
    });
  }

  window.Analitica.enviarEvento("view_item_list", {
    currency: "COP",
    item_list_id: LISTA_ID,
    item_list_name: LISTA_NOMBRE,
    items: itemsConLista()
  });

  /* ---------- select_item (clic en un producto, antes de navegar) ---------- */
  cont.addEventListener("click", function (e) {
    var enlace = e.target.closest(".tarjeta-enlace");
    if (enlace) {
      var p = window.buscarProducto(enlace.getAttribute("data-id"));
      var i = parseInt(enlace.getAttribute("data-index"), 10);
      var item = window.Carrito.itemGA(p, 1, i, false);
      item.item_list_id = LISTA_ID;
      item.item_list_name = LISTA_NOMBRE;
      var params = { currency: "COP", item_list_id: LISTA_ID, item_list_name: LISTA_NOMBRE, items: [item] };
      var nuevaPestana = e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0;
      if (nuevaPestana) {
        window.Analitica.enviarEvento("select_item", params);
      } else {
        e.preventDefault();
        window.Analitica.enviarYNavegar("select_item", params, enlace.getAttribute("href"));
      }
      return;
    }

    var boton = e.target.closest("[data-agregar]");
    if (boton) {
      var prod = window.buscarProducto(boton.getAttribute("data-agregar"));
      window.Carrito.agregar(prod.id, 1);
      var items = [window.Carrito.itemGA(prod, 1, 0, window.Carrito.hayCupon())];
      window.Analitica.enviarEvento("add_to_cart", {
        currency: "COP",
        value: window.Carrito.valorDe(items),
        items: items
      });
      window.Carrito.toast("Agregado: " + prod.nombre);
    }
  });

  /* ---------- Banner del cupón: view_promotion / select_promotion ---------- */
  var banner = document.getElementById("banner-cupon");

  function paramsPromo() {
    var items = window.PRODUCTOS.map(function (p, i) {
      var it = window.Carrito.itemGA(p, 1, i, false);
      it.promotion_id = PROMO.promotion_id;
      it.promotion_name = PROMO.promotion_name;
      it.creative_name = PROMO.creative_name;
      it.creative_slot = PROMO.creative_slot;
      return it;
    });
    return {
      currency: "COP",
      promotion_id: PROMO.promotion_id,
      promotion_name: PROMO.promotion_name,
      creative_name: PROMO.creative_name,
      creative_slot: PROMO.creative_slot,
      items: items
    };
  }

  if (window.Carrito.hayCupon()) {
    // Cupón ya aplicado: no se muestra el banner ni se envía view_promotion
    document.getElementById("cupon-aplicado").hidden = false;
  } else {
    banner.hidden = false;
    window.Analitica.enviarEvento("view_promotion", paramsPromo());
    var yaClic = false;
    banner.addEventListener("click", function () {
      if (yaClic) return;
      yaClic = true;
      window.Carrito.aplicarCupon(window.Carrito.CUPON.codigo);
      window.Analitica.enviarYNavegar("select_promotion", paramsPromo(), "carrito.html");
    });
  }
})();
